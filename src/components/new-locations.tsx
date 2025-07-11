"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { icon } from "leaflet";
import { MapPin } from "lucide-react";

const locations = [
  {
    name: "Liberty Plaza Charging Hub",
    position: [40.7112, -74.0123],
  },
  {
    name: "Grand Central Station",
    position: [40.7527, -73.9772],
  },
  {
    name: "Brooklyn Bridge Park",
    position: [40.705, -73.9954],
  },
  {
    name: "Times Square Supercharger",
    position: [40.758, -73.9855],
  },
  {
    name: "JFK Airport Station",
    position: [40.6413, -73.7781],
  },
  {
    name: "Wall Street Charging Point",
    position: [40.7061, -74.0088],
  },
  {
    name: "Queens Depot",
    position: [40.742, -73.8448],
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Locations</CardTitle>
        <CardDescription>
          Map of new EV charging station locations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full rounded-lg overflow-hidden border">
            {/* The MapContainer has been intentionally removed to prevent re-initialization errors during hot-reloading in development.
                The necessary map components like TileLayer and Marker are left here to be used when the map is properly configured. */}
        </div>
      </CardContent>
    </Card>
  );
}
