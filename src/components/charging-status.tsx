"use client";

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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "./ui/badge";

const chargingData = [
  {
    id: "EV-001",
    charge: 88,
    chargerType: "Level 2",
    timeToFull: "25 mins",
    status: "Charging",
  },
  {
    id: "EV-002",
    charge: 100,
    chargerType: "N/A",
    timeToFull: "Charged",
    status: "Idle",
  },
  {
    id: "EV-003",
    charge: 45,
    chargerType: "DC Fast Charge",
    timeToFull: "55 mins",
    status: "Charging",
  },
  {
    id: "EV-004",
    charge: 95,
    chargerType: "Level 2",
    timeToFull: "10 mins",
    status: "Charging",
  },
  {
    id: "EV-005",
    charge: 22,
    chargerType: "DC Fast Charge",
    timeToFull: "1 hr 45 mins",
    status: "Charging",
  },
  {
    id: "EV-006",
    charge: 100,
    chargerType: "N/A",
    timeToFull: "Charged",
    status: "Idle",
  },
];

const chartData = [
  { level: "0-20%", vehicles: 1 },
  { level: "21-40%", vehicles: 0 },
  { level: "41-60%", vehicles: 1 },
  { level: "61-80%", vehicles: 0 },
  { level: "81-100%", vehicles: 4 },
];

const chartConfig = {
  vehicles: {
    label: "Vehicles",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export default function ChargingStatus() {
  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Live Charging Status</CardTitle>
          <CardDescription>
            Real-time status of vehicles currently charging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle ID</TableHead>
                <TableHead className="text-center">Current Charge</TableHead>
                <TableHead>Time to Full</TableHead>
                <TableHead>Charger Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chargingData.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={vehicle.charge}
                        className="w-24"
                        aria-label={`${vehicle.charge}% charged`}
                      />
                      <span className="text-muted-foreground">
                        {vehicle.charge}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.timeToFull}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        vehicle.chargerType === "N/A" ? "secondary" : "default"
                      }
                    >
                      {vehicle.chargerType}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Fleet Battery Distribution</CardTitle>
          <CardDescription>
            Overview of battery levels across the entire fleet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 5,
                right: 20,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="level"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <YAxis allowDecimals={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="vehicles" fill="hsl(var(--primary))" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
