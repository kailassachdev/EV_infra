# app/main.py (Corrected)

from fastapi import FastAPI, Query, HTTPException
from typing import List

from .config import settings
from .models import CandidateLocation, Location
from . import analysis

# THIS IS THE CORRECTED LINE
app = FastAPI(
    title="EV Charging Station Site Finder API",
    description="An API to find optimal locations for new EV charging stations based on geospatial data.",
    version="1.0.0",
)

@app.get("/find-locations", response_model=List[CandidateLocation], tags=["Analysis"])
async def find_ev_locations(
    latitude: float = Query(..., ge=-90, le=90, description="The latitude of the search center.", example=9.9816),
    longitude: float = Query(..., ge=-180, le=180, description="The longitude of the search center.", example=76.2999)
):
    """
    Analyze a geographic area to find the top 3 optimal locations for new EV charging stations.
    """
    if not settings.is_configured:
        raise HTTPException(status_code=500, detail="Server is not configured with a valid OpenChargeMap API key.")

    try:
        all_candidates = await analysis.analyze_locations(latitude, longitude, settings.OCM_API_KEY)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"An error occurred during analysis: {e}")
        
    results = []
    for i, candidate in enumerate(all_candidates[:3]):
        tags = candidate['tags']
        site_type_val = tags.get('landuse', tags.get('amenity', 'N/A'))
        if 'landuse' in tags: site_type = f"landuse={site_type_val}"
        elif 'amenity' in tags: site_type = f"amenity={site_type_val}"
        else: site_type = 'N/A'

        formatted_candidate = CandidateLocation(
            rank=i + 1,
            site_type=site_type,
            location=Location(lat=candidate['center'][0], lon=candidate['center'][1]),
            area_m2=round(candidate['area'], 2),
            score_nearby_pois=candidate['pois_nearby'],
            market_gap_m=round(candidate['distance_from_existing_m'], 1) if candidate.get('distance_from_existing_m') else None,
            access_to_road_m=round(candidate['distance_to_road_m'], 1) if candidate.get('distance_to_road_m') else None,
            access_to_power_m=round(candidate['distance_to_power_m'], 1) if candidate.get('distance_to_power_m') else None,
            google_maps_url=f"https://www.google.com/maps?q={candidate['center'][0]},{candidate['center'][1]}"
        )
        results.append(formatted_candidate)
        
    return results

@app.get("/", tags=["Health Check"])
def read_root():
    return {"status": "ok", "message": "EV Charging Station Finder API is running. Go to /docs for documentation."}