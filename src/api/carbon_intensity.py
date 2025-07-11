from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

app = FastAPI()

class CarbonIntensityResponse(BaseModel):
    zone: str
    timestamp: datetime
    carbon_intensity: float
    classification: str
    suggested_price_per_kWh: float

@app.get("/carbon-intensity", response_model=CarbonIntensityResponse)
async def get_carbon_intensity():
    try:
        # Mock data - replace with actual data source
        return {
            "zone": "IN-SO",
            "timestamp": "2025-07-11T10:00:00.000Z",
            "carbon_intensity": 399,
            "classification": "Very Low",
            "suggested_price_per_kWh": 5.0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000) 