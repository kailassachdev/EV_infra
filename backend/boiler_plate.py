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
from typing import Optional
from pydantic import BaseModel

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

# ✅ Fixed __main__ block
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("boiler_plate:app", host="127.0.0.1", port=8000, reload=True)

