"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, RotateCcw, BatteryCharging, Building, Car, Target } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Connection {
  ID: number;
  ConnectionType: {
    Title: string;
    FormalName: string;
  };
  PowerKW: number;
  CurrentType: {
    Title: string;
    Description: string;
  };
  Quantity: number;
}

interface ChargingLocation {
  ID: number;
  AddressInfo: {
    Title: string;
    AddressLine1: string;
    AddressLine2: string;
    Town: string;
    StateOrProvince: string;
    Postcode: string;
    Distance: number;
    Latitude: number;
    Longitude: number;
  };
  Connections: Connection[];
  UsageCost: string;
  NumberOfPoints: number;
  StatusType: {
    IsOperational: boolean;
    Title: string;
  };
  GeneralComments: string;
  OperatorInfo: {
    Title: string;
  };
}

interface SiteAnalysis {
  rank: number;
  site_type: string;
  location: {
    lat: number;
    lon: number;
  };
  area_m2: number;
  score_nearby_pois: number;
  market_gap_m: number;
  access_to_road_m: number;
  access_to_power_m: number;
  google_maps_url: string;
}

const fastChargingIcon = L.divIcon({
  html: `
    <div style="background: #3b82f6; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  className: 'charging-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20]
});

const mediumChargingIcon = L.divIcon({
  html: `
    <div style="background: #f59e0b; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  className: 'charging-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20]
});

const slowChargingIcon = L.divIcon({
  html: `
    <div style="background: #10b981; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  className: 'charging-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 20],
  popupAnchor: [0, -20]
});

const siteAnalysisIcon = L.divIcon({
  html: `
    <div style="background: #8b5cf6; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
      <div style="width: 4px; height: 4px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  className: 'site-analysis-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 16],
  popupAnchor: [0, -16]
});

const getChargingIcon = (connections: Connection[]) => {
  const maxPower = Math.max(...connections.map(conn => conn.PowerKW || 0));
  if (maxPower >= 50) return fastChargingIcon;
  if (maxPower >= 20) return mediumChargingIcon;
  return slowChargingIcon;
};

const createPopupContent = (location: ChargingLocation) => {
  const maxPower = Math.max(...location.Connections.map(conn => conn.PowerKW || 0));
  const connectorTypes = location.Connections.map(conn => conn.ConnectionType.Title)
    .filter((value, index, self) => self.indexOf(value) === index)
    .join(", ");

  return `
    <div style="padding: 8px; font-family: system-ui;">
      <div style="font-weight: 600; margin-bottom: 4px;">${location.AddressInfo.Title}</div>
      <div style="font-size: 12px; color: #666;">
        <div>Max Power: ${maxPower}kW</div>
        <div>Cost: ${location.UsageCost}</div>
        <div>Connectors: ${connectorTypes}</div>
      </div>
    </div>
  `;
};

const createSiteAnalysisPopup = (site: SiteAnalysis) => {
  return `
    <div style="padding: 8px; font-family: system-ui;">
      <div style="font-weight: 600; margin-bottom: 4px;">Site Analysis #${site.rank}</div>
      <div style="font-size: 12px; color: #666;">
        <div>Type: ${site.site_type}</div>
        <div>Area: ${site.area_m2}m²</div>
        <div>POI Score: ${site.score_nearby_pois}</div>
        <div>Market Gap: ${site.market_gap_m}m</div>
      </div>
    </div>
  `;
};

export default function SimpleEVChargerFinder() {
  const [locations, setLocations] = useState<ChargingLocation[]>([]);
  const [siteAnalysis, setSiteAnalysis] = useState<SiteAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const siteMarkersRef = useRef<L.Marker[]>([]);
  const searchCircleRef = useRef<L.Circle | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const fetchLocations = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&latitude=${lat}&longitude=${lng}&maxresults=15&key=244f5073-183e-4775-a919-2478ab7c0551`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch charging stations");
      }
      const data = await response.json();
      setLocations(data);
      setSearchCenter({ lat, lng });
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const fetchSiteAnalysis = async (lat: number, lng: number) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/find-locations?latitude=${lat}&longitude=${lng}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch site analysis");
      }
      const data = await response.json();
      setSiteAnalysis(data);
      setIsAnalyzing(false);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Failed to analyze sites");
      setIsAnalyzing(false);
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];
  };

  const clearSiteMarkers = () => {
    siteMarkersRef.current.forEach(marker => {
      if (mapRef.current) {
        mapRef.current.removeLayer(marker);
      }
    });
    siteMarkersRef.current = [];
  };

  const clearSearchCircle = () => {
    if (searchCircleRef.current && mapRef.current) {
      mapRef.current.removeLayer(searchCircleRef.current);
      searchCircleRef.current = null;
    }
  };

  const addMarkers = () => {
    if (!mapRef.current) return;

    locations.forEach((location) => {
      const marker = L.marker(
        [location.AddressInfo.Latitude, location.AddressInfo.Longitude],
        { 
          icon: getChargingIcon(location.Connections),
          riseOnHover: true
        }
      )
        .addTo(mapRef.current!)
        .bindPopup(createPopupContent(location), {
          closeButton: false,
          maxWidth: 250
        });

      marker.on('mouseover', () => {
        marker.openPopup();
      });

      marker.on('mouseout', () => {
        marker.closePopup();
      });

      markersRef.current.push(marker);
    });
  };

  const addSiteMarkers = () => {
    if (!mapRef.current) return;

    siteAnalysis.forEach((site) => {
      const marker = L.marker(
        [site.location.lat, site.location.lon],
        { 
          icon: siteAnalysisIcon,
          riseOnHover: true
        }
      )
        .addTo(mapRef.current!)
        .bindPopup(createSiteAnalysisPopup(site), {
          closeButton: false,
          maxWidth: 200
        });

      marker.on('mouseover', () => {
        marker.openPopup();
      });

      marker.on('mouseout', () => {
        marker.closePopup();
      });

      siteMarkersRef.current.push(marker);
    });
  };

  const addSearchCircle = (lat: number, lng: number) => {
    if (!mapRef.current) return;

    searchCircleRef.current = L.circle([lat, lng], {
      color: '#3b82f6',
      weight: 2,
      opacity: 0.6,
      dashArray: '5 5',
      fillColor: '#3b82f6',
      fillOpacity: 0.1,
      radius: 3000
    }).addTo(mapRef.current);
  };

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([8.5241, 76.9366], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        fetchLocations(lat, lng);
        fetchSiteAnalysis(lat, lng);
      });

      // Updated legend
      const LegendControl = L.Control.extend({
        onAdd: () => {
          const div = L.DomUtil.create('div', 'legend');
          div.innerHTML = `
            <div style="background: white; padding: 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-size: 11px;">
              <div style="font-weight: 600; margin-bottom: 4px;">Charging Speed</div>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                <div style="background: #3b82f6; border-radius: 50%; width: 8px; height: 8px;"></div>
                Fast (50kW+)
              </div>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
                <div style="background: #f59e0b; border-radius: 50%; width: 8px; height: 8px;"></div>
                Medium (20-49kW)
              </div>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
                <div style="background: #10b981; border-radius: 50%; width: 8px; height: 8px;"></div>
                Standard (<20kW)
              </div>
              <div style="font-weight: 600; margin-bottom: 4px;">Site Analysis</div>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
                <div style="background: #8b5cf6; border-radius: 50%; width: 6px; height: 6px;"></div>
                Potential Site
              </div>
              <div style="color: #666; margin-top: 4px;">Click to search</div>
            </div>
          `;
          return div;
        }
      });

      new LegendControl({ position: 'bottomright' }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
      siteMarkersRef.current = [];
      searchCircleRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (locations.length > 0 && mapRef.current) {
      clearMarkers();
      addMarkers();
    }
  }, [locations]);

  useEffect(() => {
    if (siteAnalysis.length > 0 && mapRef.current) {
      clearSiteMarkers();
      addSiteMarkers();
    }
  }, [siteAnalysis]);

  useEffect(() => {
    if ((locations.length > 0 || siteAnalysis.length > 0) && mapRef.current) {
      clearSearchCircle();

      if (searchCenter) {
        addSearchCircle(searchCenter.lat, searchCenter.lng);
      }

      const allMarkers = [...markersRef.current, ...siteMarkersRef.current];
      if (allMarkers.length > 0) {
        const group = new L.FeatureGroup(allMarkers);
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [locations, siteAnalysis, searchCenter]);

  const resetMap = () => {
    clearMarkers();
    clearSiteMarkers();
    clearSearchCircle();
    setLocations([]);
    setSiteAnalysis([]);
    setSearchCenter(null);
    setError(null);
    setAnalysisError(null);
    if (mapRef.current) {
      mapRef.current.setView([8.5241, 76.9366], 12);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">⚡ EV Charging Stations & Site Analysis</h1>
        <p className="text-gray-600">Click anywhere on the map to find nearby charging stations and analyze potential sites</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Map</CardTitle>
                <button
                  onClick={resetMap}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="relative h-full">
                <div
                  ref={mapContainerRef}
                  className="h-[600px] w-full cursor-crosshair"
                />
                {(isLoading || isAnalyzing) && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        <span className="text-sm">
                          {isLoading && isAnalyzing ? 'Searching & Analyzing...' : 
                           isLoading ? 'Searching...' : 'Analyzing...'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Site Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {analysisError && (
                <div className="text-center text-red-600 p-4">
                  <p className="font-medium">Analysis unavailable</p>
                  <p className="text-sm">{analysisError}</p>
                </div>
              )}
              
              {!analysisError && !isAnalyzing && siteAnalysis.length === 0 && !searchCenter && (
                <div className="text-center text-gray-500 p-6">
                  <Building className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Click on the map to analyze potential sites</p>
                </div>
              )}

              {!analysisError && !isAnalyzing && siteAnalysis.length === 0 && searchCenter && (
                <div className="text-center text-gray-500 p-6">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No suitable sites found in this area</p>
                </div>
              )}

              {siteAnalysis.length > 0 && (
                <div className="space-y-3">
                  {siteAnalysis.map((site) => (
                    <div key={site.rank} className="p-3 border rounded-lg bg-purple-50 border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                            {site.rank}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {site.site_type.replace(/[_=]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Area:</span>
                          <span>{site.area_m2}m²</span>
                        </div>
                        <div className="flex justify-between">
                          <span>POI Score:</span>
                          <span>{site.score_nearby_pois}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Market Gap:</span>
                          <span>{site.market_gap_m}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Road Access:</span>
                          <span>{site.access_to_road_m}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Power Access:</span>
                          <span>{site.access_to_power_m}m</span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <a 
                          href={site.google_maps_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View on Google Maps →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}