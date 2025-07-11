"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BatteryCharging, Zap, MapPin, Clock } from "lucide-react";
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

// Define different marker icons based on charging speed
const fastChargingIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" width="24" height="24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>`,
  className: 'charging-marker fast',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const mediumChargingIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="orange" stroke-width="2" width="24" height="24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>`,
  className: 'charging-marker medium',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

const slowChargingIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2" width="24" height="24">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>`,
  className: 'charging-marker slow',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24]
});

// Helper function to get the appropriate icon based on charging power
const getChargingIcon = (connections: Connection[]) => {
  const maxPower = Math.max(...connections.map(conn => conn.PowerKW || 0));
  if (maxPower >= 50) return fastChargingIcon;
  if (maxPower >= 20) return mediumChargingIcon;
  return slowChargingIcon;
};

// Helper function to create a custom popup content
const createPopupContent = (location: ChargingLocation) => {
  const maxPower = Math.max(...location.Connections.map(conn => conn.PowerKW || 0));
  const connectorTypes = location.Connections.map(conn => conn.ConnectionType.Title)
    .filter((value, index, self) => self.indexOf(value) === index)
    .join(", ");

  return `
    <div class="p-2">
      <div class="font-semibold text-base mb-1">${location.AddressInfo.Title}</div>
      <div class="text-sm mb-1">${location.OperatorInfo.Title}</div>
      <div class="text-sm text-muted-foreground">
        <div>Max Power: ${maxPower}kW</div>
        <div>Cost: ${location.UsageCost}</div>
        <div>Connectors: ${connectorTypes}</div>
      </div>
    </div>
  `;
};

export default function NewLocations() {
  const [locations, setLocations] = useState<ChargingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ChargingLocation | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch(
          "https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&latitude=10.0531&longitude=76.354&maxresults=10&key=244f5073-183e-4775-a919-2478ab7c0551"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch charging stations");
        }
        const data = await response.json();
        setLocations(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (locations.length > 0 && mapContainerRef.current && !mapRef.current) {
      // Initialize map
      const centerLocation = locations[0].AddressInfo;
      mapRef.current = L.map(mapContainerRef.current).setView(
        [centerLocation.Latitude, centerLocation.Longitude],
        13
      );

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Add circle for search radius
      L.circle([centerLocation.Latitude, centerLocation.Longitude], {
        color: 'blue',
        fillColor: '#30f',
        fillOpacity: 0.1,
        radius: 3000 // 3km radius
      }).addTo(mapRef.current);

      // Add markers for each location
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
            maxWidth: 300,
            className: 'custom-popup'
          });

        // Add hover effect with proper typing
        marker.on('mouseover', (e: L.LeafletEvent) => {
          marker.openPopup();
        });

        // Add click handler
        marker.on('click', () => {
          setSelectedLocation(location);
          mapRef.current?.panTo([
            location.AddressInfo.Latitude,
            location.AddressInfo.Longitude
          ]);
        });

        // Store marker reference
        markersRef.current.push(marker);
      });

      // Add legend as a custom control
      const LegendControl = L.Control.extend({
        onAdd: () => {
          const div = L.DomUtil.create('div', 'info legend');
          div.innerHTML = `
            <div class="bg-white p-2 rounded-lg shadow-lg">
              <div class="text-sm font-semibold mb-1">Charging Speed</div>
              <div class="flex items-center gap-1 text-xs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Fast (50kW+)
              </div>
              <div class="flex items-center gap-1 text-xs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="orange" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Medium (20-49kW)
              </div>
              <div class="flex items-center gap-1 text-xs">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Standard (<20kW)
              </div>
            </div>
          `;
          return div;
        }
      });

      new LegendControl({ position: 'bottomright' }).addTo(mapRef.current);
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, [locations]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Charging Stations</CardTitle>
          <CardDescription>Loading charging stations...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="lg:row-span-2">
        <CardHeader>
          <CardTitle>Charging Stations Map</CardTitle>
          <CardDescription>
            Click on a marker to view station details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={mapContainerRef}
            className="h-[600px] w-full rounded-lg overflow-hidden border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Station Details</CardTitle>
          <CardDescription>
            {selectedLocation
              ? "Selected charging station information"
              : "Select a station from the map"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedLocation ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {selectedLocation.AddressInfo.Title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedLocation.OperatorInfo.Title}
                    </p>
                  </div>
                  <Badge
                    variant={
                      selectedLocation.StatusType.IsOperational
                        ? "default"
                        : "destructive"
                    }
                  >
                    {selectedLocation.StatusType.Title}
                  </Badge>
                </div>

                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {selectedLocation.AddressInfo.AddressLine1}
                      {selectedLocation.AddressInfo.AddressLine2
                        ? `, ${selectedLocation.AddressInfo.AddressLine2}`
                        : ""}
                      , {selectedLocation.AddressInfo.Town}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4" />
                    <span>{selectedLocation.UsageCost}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">
                    Available Connectors:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedLocation.Connections.map((conn) => (
                      <div
                        key={conn.ID}
                        className="flex items-center gap-2 text-sm p-2 bg-muted rounded-md"
                      >
                        <BatteryCharging className="h-4 w-4" />
                        <div>
                          <span className="font-medium">
                            {conn.ConnectionType.Title}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            • {conn.PowerKW}kW × {conn.Quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedLocation.GeneralComments && (
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedLocation.GeneralComments}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Click on a charging station marker on the map to view its details
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
