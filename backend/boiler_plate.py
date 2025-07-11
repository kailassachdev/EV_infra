from collections import Counter
from datetime import datetime, timedelta
import os
import random
import uuid
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from dotenv import load_dotenv
import json
from io import BytesIO
from fastapi.middleware.cors import CORSMiddleware
import base64
from fastapi.responses import FileResponse, JSONResponse
import requests
from typing import Optional, List
from pydantic import BaseModel
from fastapi import FastAPI, Query
import pandas as pd
import requests
import os
import random
import json
from dotenv import load_dotenv
from openai import OpenAI
import uvicorn
import math
from ev_finder_api.app.models import CandidateLocation, Location
from ev_finder_api.app.analysis import analyze_locations
from ev_finder_api.app.config import settings


load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Electricity Maps API
API_TOKEN = os.getenv("API_TOKEN")
ZONE = "IN-SO"
URL = f"https://api.electricitymap.org/v3/carbon-intensity/latest?zone={ZONE}"
headers = {
    "auth-token": API_TOKEN
}

# Classification logic
def classify_carbon_intensity(intensity: float) -> str:
    if intensity <= 430.83:
        return "Very Low"
    elif intensity <= 471.44:
        return "Low"
    elif intensity <= 508.25:
        return "Moderate"
    elif intensity <= 558.47:
        return "High"
    else:
        return "Very High"

# Dynamic pricing based on renewable availability
def get_dynamic_price(level: str) -> float:
    pricing = {
        "Very Low": 5.00,
        "Low": 6.50,
        "Moderate": 8.50,
        "High": 11.00,
        "Very High": 14.00
    }
    return pricing.get(level, 8.50)

# Root route
@app.get("/")
def root():
    return {"message": "⚡ FastAPI EV pricing service is running."}

# Main endpoint for real-time carbon & price data
@app.get("/carbon-intensity")
def get_carbon_intensity():
    try:
        print("⚡ Sending API request...")
        response = requests.get(URL, headers=headers, timeout=10)
        print(f"✅ Status Code: {response.status_code}")
        print(f"📦 Response Preview: {response.text[:200]}")

        if response.status_code == 200:
            data = response.json()
            carbon_intensity = data.get("carbonIntensity")
            timestamp = data.get("datetime")

            if carbon_intensity is not None:
                classification = classify_carbon_intensity(carbon_intensity)
                price = get_dynamic_price(classification)

                return {
                    "zone": ZONE,
                    "timestamp": timestamp,
                    "carbon_intensity": carbon_intensity,
                    "classification": classification,
                    "suggested_price_per_kWh": price
                }
            else:
                return JSONResponse(
                    status_code=502,
                    content={"error": "Carbon intensity not found in API response"}
                )
        else:
            return JSONResponse(
                status_code=response.status_code,
                content={"error": response.text}
            )

    except requests.exceptions.Timeout:
        return JSONResponse(
            status_code=504,
            content={"error": "API request timed out after 10 seconds"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

# --- Models for /find-locations ---
# REMOVE Location and CandidateLocation models as they are now imported directly

# --- Dummy analysis function ---
# REMOVE dummy_analyze_locations and its usage

@app.get("/find-locations", response_model=List[CandidateLocation])
async def find_ev_locations(
    latitude: float = Query(..., ge=-90, le=90, description="The latitude of the search center."),
    longitude: float = Query(..., ge=-180, le=180, description="The longitude of the search center.")
):
    """
    Analyze a geographic area to find the top 3 optimal locations for new EV charging stations.
    """
    if not settings.is_configured:
        raise HTTPException(status_code=500, detail="Server is not configured with a valid OpenChargeMap API key.")
    try:
        all_candidates = await analyze_locations(latitude, longitude, settings.OCM_API_KEY)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"An error occurred during analysis: {e}")
    results = []
    for i, candidate in enumerate(all_candidates[:3]):
        tags = candidate['tags']
        site_type_val = tags.get('landuse', tags.get('amenity', 'N/A'))
        if 'landuse' in tags:
            site_type = f"landuse={site_type_val}"
        elif 'amenity' in tags:
            site_type = f"amenity={site_type_val}"
        else:
            site_type = 'N/A'
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

# ✅ Fixed __main__ block
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("boiler_plate:app", host="127.0.0.1", port=8000, reload=True)

