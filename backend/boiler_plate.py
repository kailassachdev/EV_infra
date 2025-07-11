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

OCM_API_KEY = os.getenv("OPENCHARGEMAP_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_KEY)

# === LOAD DATASET ON STARTUP ===
df = pd.read_csv("smart_charging_log.csv")
healthy_example = df[df["is_healthy"] == 1].iloc[0]
faulty_example = df[df["is_healthy"] == 0].iloc[0]


def format_log(row, include_label=True):
    text = (
        f"Energy: {row['El_kWh']} kWh\n"
        f"Duration: {row['Duration_hours']} hrs\n"
        f"Frequent disconnects: {'Yes' if row['is_frequent_connect_disconnect'] else 'No'}\n"
        f"Low kWh: {'Yes' if row['is_low_kwh'] else 'No'}\n"
        f"Short duration: {'Yes' if row['is_short_duration'] else 'No'}"
    )
    if include_label:
        text += f"\nHealthy: {'Yes' if row['is_healthy'] else 'No'}"
    return text

def generate_fake_session():
    is_healthy = random.random() < 0.6
    
    if is_healthy:
        energy = round(random.uniform(3.0, 6.5), 2)
        duration = round(random.uniform(0.5, 1.8), 2)
        disconnects = random.randint(0, 1)
    else:
        energy = round(random.uniform(0.1, 0.4), 2)
        duration = round(random.uniform(0.05, 0.3), 2)
        disconnects = random.randint(2, 3)
    
    return {
        "El_kWh": energy,
        "Duration_hours": duration,
        "is_frequent_connect_disconnect": 1 if disconnects > 1 else 0,
        "is_low_kwh": 1 if energy < 0.5 else 0,
        "is_short_duration": 1 if duration < 0.2 else 0
    }

def safe_parse_json_maintenance_response(response):
    try:
        response = response.strip()
        start = response.find('{')
        end = response.rfind('}') + 1
        if start != -1 and end != 0:
            json_str = response[start:end]
            result = json.loads(json_str)
            return {
                'needs_maintenance': bool(result['needs_maintenance']),
                'reason': result.get('reason', 'No reason provided'),
                'estimated_life_months': result.get('estimated_life_months', None)
            }
        else:
            return {'needs_maintenance': True, 'reason': 'Malformed JSON', 'estimated_life_months': None}
    except Exception as e:
        return {'needs_maintenance': True, 'reason': f'Parsing error: {str(e)}', 'estimated_life_months': None}

def generate_random_coordinates(center_lat, center_lon, radius_km):
    r = radius_km / 111  # ~111 km per degree
    u, v = random.random(), random.random()
    w = r * math.sqrt(u)
    t = 2 * math.pi * v
    dx = w * math.cos(t)
    dy = w * math.sin(t)
    return center_lat + dy, center_lon + dx

async def predict_for_station(lat, lon):
    session = generate_fake_session()
    test_prompt = format_log(pd.Series(session), include_label=False)
    few_shot_prompt = (
        "Example 1:\n" + format_log(healthy_example) + "\n\n" +
        "Example 2:\n" + format_log(faulty_example) + "\n\n"
    )
    full_prompt = (
        few_shot_prompt +
        "Now analyze this station:\n" +
        test_prompt +
        f"\nLocation: lat {lat}, lon {lon}\n\n" +
        "👉 Question: Should this EV charger be flagged for maintenance?\n\n" +
        "IMPORTANT: Respond with valid JSON only in this format:\n" +
        "{\n" +
        '  "needs_maintenance": true/false,\n' +
        '  "reason": "One line explanation (required if needs_maintenance is true)",\n' +
        '  "estimated_life_months": If needs_maintenance is true, provide your best estimate (as an integer) of how many months the station can continue to operate before critical failure, based on the provided data. If not, use null.\n' +
        "}"
    )
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": full_prompt}],
        temperature=0.3
    )
    raw_answer = response.choices[0].message.content
    maintenance = safe_parse_json_maintenance_response(raw_answer)
    return {
        "lat": lat,
        "lon": lon,
        "El_kWh": session['El_kWh'],
        "Duration_hours": session['Duration_hours'],
        **maintenance
    }

@app.get("/maintenance/nearby")
async def maintenance_nearby(count: int = Query(15, ge=15, le=25), radius_km: float = 5.0,
                             center_lat: float = 28.6139, center_lon: float = 77.2090):
    results = []
    for _ in range(count):
        lat, lon = generate_random_coordinates(center_lat, center_lon, radius_km)
        result = await predict_for_station(lat, lon)
        results.append(result)
    return {"stations_checked": count, "results": results}



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

