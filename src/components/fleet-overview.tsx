"use client";

import {
  BatteryCharging,
  MapPin,
  ParkingCircle,
  Car,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const fleetData = [
  {
    id: "EV-001",
    location: "Main Depot, Dock 3",
    battery: 88,
    status: "Charging",
    icon: <BatteryCharging className="h-4 w-4 text-accent" />,
  },
  {
    id: "EV-002",
    location: "Downtown Hub",
    battery: 100,
    status: "Idle",
    icon: <ParkingCircle className="h-4 w-4 text-gray-500" />,
  },
  {
    id: "EV-003",
    location: "En route to North Sector",
    battery: 45,
    status: "In-Transit",
    icon: <Car className="h-4 w-4 text-blue-500" />,
  },
  {
    id: "EV-004",
    location: "Westside Warehouse",
    battery: 95,
    status: "Charging",
    icon: <BatteryCharging className="h-4 w-4 text-accent" />,
  },
  {
    id: "EV-005",
    location: "City Center",
    battery: 22,
    status: "In-Transit",
    icon: <Car className="h-4 w-4 text-blue-500" />,
  },
  {
    id: "EV-006",
    location: "Main Depot, Dock 1",
    battery: 100,
    status: "Idle",
    icon: <ParkingCircle className="h-4 w-4 text-gray-500" />,
  },
  {
    id: "EV-007",
    location: "Servicing at HQ",
    battery: 70,
    status: "Maintenance",
    icon: <BatteryCharging className="h-4 w-4 text-yellow-500" />,
  },
];

export default function FleetOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Overview</CardTitle>
        <CardDescription>
          A complete list of all vehicles in the fleet and their current status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle ID</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-center">Battery Level</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fleetData.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell className="font-medium">{vehicle.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{vehicle.location}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Progress
                      value={vehicle.battery}
                      className="w-24"
                      aria-label={`${vehicle.battery}% battery`}
                    />
                    <span className="text-muted-foreground">
                      {vehicle.battery}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      vehicle.status === "In-Transit" ? "outline" : "default"
                    }
                    className={`capitalize ${
                      vehicle.status === "Charging"
                        ? "bg-accent text-accent-foreground"
                        : ""
                    } ${
                      vehicle.status === "Maintenance"
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {vehicle.icon}
                      {vehicle.status}
                    </div>
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
