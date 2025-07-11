"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import L, { icon, Map } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { useEffect, useRef } from "react";

const locations = [
  {
    name: "Liberty Plaza Charging Hub",
    position: [40.7112, -74.0123] as L.LatLngExpression,
  },
  {
    name: "Grand Central Station",
    position: [40.7527, -73.9772] as L.LatLngExpression,
  },
  {
    name: "Brooklyn Bridge Park",
    position: [40.705, -73.9954] as L.LatLngExpression,
  },
  {
    name: "Times Square Supercharger",
    position: [40.758, -73.9855] as L.LatLngExpression,
  },
  {
    name: "JFK Airport Station",
    position: [40.6413, -73.7781] as L.LatLngExpression,
  },
  {
    name: "Wall Street Charging Point",
    position: [40.7061, -74.0088] as L.LatLngExpression,
  },
  {
    name: "Queens Depot",
    position: [40.742, -73.8448] as L.LatLngExpression,
  },
];

const customIcon = icon({
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImhzbCh2YXIoLS1wcmltYXJ5KSkiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1tYXAtcGluIj48cGF0aCBkPSJNMjAgMTBhOCA4IDAgMSAwLTE2IDAgOCA4IDAgMCAwIDE2IDBaIi8+PHBhdGggZD0iTTIyIDExYTggOCAwIDEgMS0uNSA0TTIgMTJhOCA4IDAgMCAxIDMuNS02LjgiLz48L3N2Zz4=",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

export default function NewLocations() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      // Initialize map
      mapRef.current = L.map(mapContainerRef.current).setView(
        [40.7128, -74.006],
        12
      );

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      // Add markers
      locations.forEach((location) => {
        L.marker(location.position, { icon: customIcon })
          .addTo(mapRef.current!)
          .bindPopup(
            `<div class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span class="font-semibold">${location.name}</span></div>`, {
              closeButton: false,
              minWidth: 0,
            }
          );
      });
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and cleanup on unmount

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Locations</CardTitle>
        <CardDescription>
          Map of new EV charging station locations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={mapContainerRef}
          className="h-[500px] w-full rounded-lg overflow-hidden border"
        />
      </CardContent>
    </Card>
  );
}
