# app/analysis.py (Updated with Async aiohttp)

import asyncio
import httpx # Use httpx for async requests
import sys
from typing import List, Dict
import time

from geojson import Polygon, Feature, LineString
from turfpy.measurement import area, centroid, point_to_line_distance
from geopy.distance import geodesic

# Analysis Parameters
SEARCH_RADIUS_M = 10000
MIN_AREA_M2 = 50
MAX_DISTANCE_TO_POWER_M = 200
MAX_DISTANCE_TO_ROAD_M = 100
MIN_POIS_NEARBY = 3
POI_SEARCH_RADIUS_M = 250
MIN_DISTANCE_FROM_EXISTING_STATION_M = 1000

overpass_url = "https://overpass-api.de/api/interpreter"
ocm_api_url = "https://api.openchargemap.io/v3/poi/"

# Rate limiting
last_request_time = 0
MIN_REQUEST_INTERVAL = 1.0  # 1 second between requests

async def run_async_query(client: httpx.AsyncClient, query: str, name: str):
    """Helper to run a single async Overpass query with rate limiting and retry."""
    global last_request_time
    
    # Rate limiting
    current_time = time.time()
    time_since_last = current_time - last_request_time
    if time_since_last < MIN_REQUEST_INTERVAL:
        await asyncio.sleep(MIN_REQUEST_INTERVAL - time_since_last)
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            print(f"  -> Starting query for: {name} (attempt {attempt + 1})")
            last_request_time = time.time()
            response = await client.post(overpass_url, data={"data": query}, timeout=120.0)
            
            if response.status_code == 429:
                wait_time = (attempt + 1) * 2  # Exponential backoff: 2s, 4s, 6s
                print(f"  !! Rate limited for: {name}, waiting {wait_time}s...")
                await asyncio.sleep(wait_time)
                continue
                
            response.raise_for_status()
            print(f"  <- Finished query for: {name}")
            return response.json().get("elements", [])
            
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429 and attempt < max_retries - 1:
                wait_time = (attempt + 1) * 2
                print(f"  !! Rate limited for: {name}, waiting {wait_time}s...")
                await asyncio.sleep(wait_time)
                continue
            else:
                print(f"  !! FAILED query for: {name} - {e}")
                return []
        except httpx.RequestError as e:
            print(f"  !! FAILED query for: {name} - {e}")
            return []
    
    print(f"  !! FAILED query for: {name} after {max_retries} attempts")
    return []


async def analyze_locations(center_lat: float, center_lon: float, api_key: str) -> List[Dict]:
    """
    Performs data fetching and analysis using ASYNCHRONOUS network calls for performance.
    """
    print("--- Starting Async Analysis ---")

    # --- 1. Define all queries ---
    free_spaces_query = f"""[out:json][timeout:90];(way(around:{SEARCH_RADIUS_M},{center_lat},{center_lon})["landuse"~"commercial|industrial"];way(around:{SEARCH_RADIUS_M},{center_lat},{center_lon})["amenity"="parking"];);out body;>;out skel qt;"""
    poi_query = f"""[out:json][timeout:60];(node(around:{SEARCH_RADIUS_M},{center_lat},{center_lon})["amenity"~"restaurant|cafe|fast_food|bar|pub|cinema|marketplace|hospital|clinic|pharmacy|bank|fuel|mall|supermarket"];node(around:{SEARCH_RADIUS_M},{center_lat},{center_lon})["shop"~"supermarket|convenience|mall"];);out center;"""
    power_query = f"""[out:json][timeout:60];(node(around:{SEARCH_RADIUS_M},{center_lat},{center_lon})["power"~"substation|transformer"];way(around:{SEARCH_RADIUS_M},{center_lat},{center_lon})["power"~"substation"];);out center;"""
    major_roads_query = f"""[out:json][timeout:60];way(around:{SEARCH_RADIUS_M},{center_lat},{center_lon})["highway"~"primary|secondary|tertiary|trunk"];out body;>;out skel qt;"""

    # --- 2. Run all Overpass queries SEQUENTIALLY to avoid rate limiting ---
    async with httpx.AsyncClient() as client:
        # Run queries sequentially instead of in parallel to avoid rate limiting
        print("-> Running queries sequentially to avoid rate limiting...")
        spaces_elements = await run_async_query(client, free_spaces_query, "Spaces")
        await asyncio.sleep(1)  # Wait between requests
        
        poi_elements = await run_async_query(client, poi_query, "POIs")
        await asyncio.sleep(1)  # Wait between requests
        
        power_elements = await run_async_query(client, power_query, "Power")
        await asyncio.sleep(1)  # Wait between requests
        
        road_elements = await run_async_query(client, major_roads_query, "Roads")

    print(f"-> All Overpass queries complete. Spaces:{len(spaces_elements)}, POIs:{len(poi_elements)}, Power:{len(power_elements)}, Roads:{len(road_elements)}")
    
    # --- 3. Fetch OCM data (can also be run in parallel, but it's fast anyway) ---
    print("-> Fetching existing stations from OpenChargeMap...")
    try:
        async with httpx.AsyncClient() as client:
            ocm_params = {'output': 'json', 'latitude': center_lat, 'longitude': center_lon, 'distance': SEARCH_RADIUS_M / 1000, 'distanceunit': 'km', 'maxresults': 200, 'key': api_key}
            response = await client.get(ocm_api_url, params=ocm_params, timeout=30.0)
            response.raise_for_status()
            existing_stations_data = response.json()
    except httpx.RequestError:
        existing_stations_data = []

    # --- 4. Process and Analyze (this part is synchronous and fast) ---
    print("-> Processing all data and finding candidates...")
    
    poi_coords = [(p['lat'], p['lon']) for p in poi_elements if 'lat' in p]
    power_coords = [p for p in [(el.get('center', {}).get('lat', el.get('lat')), el.get('center', {}).get('lon', el.get('lon'))) for el in power_elements] if p[0] is not None]
    
    all_road_nodes = {el["id"]: (el["lon"], el["lat"]) for el in road_elements if el["type"] == "node"}
    major_road_lines = [Feature(geometry=LineString([all_road_nodes.get(nid) for nid in el.get("nodes", []) if nid in all_road_nodes])) for el in road_elements if el["type"] == "way" and len(el.get("nodes", [])) >= 2]
    
    existing_stations_coords = [(s['AddressInfo']['Latitude'], s['AddressInfo']['Longitude']) for s in existing_stations_data if s.get('AddressInfo', {}).get('Latitude')]
    
    space_nodes = {el["id"]: (el["lon"], el["lat"]) for el in spaces_elements if el["type"] == "node"}
    top_candidates = []
    
    for el in spaces_elements:
        if el["type"] == "way" and "nodes" in el:
            coords = [space_nodes.get(nid) for nid in el["nodes"] if nid in space_nodes]
            if len(coords) < 3: continue
            if coords[0] != coords[-1]: coords.append(coords[0])

            feature = Feature(geometry=Polygon([coords]))
            surface_area = area(feature)

            if surface_area >= MIN_AREA_M2:
                center_point_feature = centroid(feature)
                center_lon_calc, center_lat_calc = center_point_feature['geometry']['coordinates']
                space_center = (center_lat_calc, center_lon_calc)

                min_dist_to_existing_station = min(geodesic(space_center, s).meters for s in existing_stations_coords) if existing_stations_coords else None

                if min_dist_to_existing_station is None or min_dist_to_existing_station >= MIN_DISTANCE_FROM_EXISTING_STATION_M:
                    pois_nearby_count = sum(1 for p in poi_coords if geodesic(space_center, p).meters <= POI_SEARCH_RADIUS_M)
                    min_dist_to_power = min(geodesic(space_center, p).meters for p in power_coords) if power_coords else None
                    min_dist_to_road = min(point_to_line_distance(center_point_feature, line, units='m') for line in major_road_lines) if major_road_lines else None
                    
                    if (pois_nearby_count >= MIN_POIS_NEARBY and
                        (min_dist_to_power is None or min_dist_to_power <= MAX_DISTANCE_TO_POWER_M) and
                        (min_dist_to_road is None or min_dist_to_road <= MAX_DISTANCE_TO_ROAD_M)):
                        
                        candidate = {"center": space_center, "area": surface_area, "pois_nearby": pois_nearby_count, "distance_to_power_m": min_dist_to_power, "distance_to_road_m": min_dist_to_road, "distance_from_existing_m": min_dist_to_existing_station, "tags": el.get("tags", {})}
                        top_candidates.append(candidate)

    print(f"   ...Processing complete! Found {len(top_candidates)} viable candidates before sorting.")
    print("--- Analysis Finished ---")
    top_candidates.sort(key=lambda x: (-x['pois_nearby'], -(x['distance_from_existing_m'] or -1), (x['distance_to_road_m'] or sys.maxsize), (x['distance_to_power_m'] or sys.maxsize)))
    return top_candidates