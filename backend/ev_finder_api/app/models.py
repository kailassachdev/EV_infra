from pydantic import BaseModel, Field
from typing import Optional

class Location(BaseModel):
    lat: float = Field(..., example=9.9816, description="Latitude of the location")
    lon: float = Field(..., example=76.2999, description="Longitude of the location")

class CandidateLocation(BaseModel):
    rank: int = Field(..., example=1, description="The rank of the candidate based on scoring.")
    site_type: str = Field(..., example="amenity=parking", description="The type of land (e.g., commercial, industrial, parking).")
    location: Location = Field(..., description="The latitude and longitude of the site's center.")
    area_m2: float = Field(..., example=550.75, description="The total area of the site in square meters.")
    score_nearby_pois: int = Field(..., example=5, description="Number of points of interest within the POI search radius.")
    market_gap_m: Optional[float] = Field(None, example=1250.5, description="Distance in meters to the nearest existing charging station.")
    access_to_road_m: Optional[float] = Field(None, example=45.2, description="Distance in meters to the nearest major road.")
    access_to_power_m: Optional[float] = Field(None, example=110.0, description="Distance in meters to the nearest power grid asset.")
    google_maps_url: str = Field(..., example="https://www.google.com/maps?q=9.9816,76.2999")