"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Badge } from "./ui/badge";

const energyData = [
  { name: "Solar", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Wind", value: 30, color: "hsl(var(--chart-2))" },
  { name: "Hydro", value: 15, color: "hsl(var(--chart-3))" },
  { name: "Geothermal", value: 10, color: "hsl(var(--chart-4))" },
];

const chartConfig = {
  value: {
    label: "Energy %",
  },
  solar: {
    label: "Solar",
    color: "hsl(var(--chart-1))",
  },
  wind: {
    label: "Wind",
    color: "hsl(var(--chart-2))",
  },
  hydro: {
    label: "Hydro",
    color: "hsl(var(--chart-3))",
  },
  geothermal: {
    label: "Geothermal",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const carbonEmissions = 320; // Example value

const getEmissionLevel = (emissions: number) => {
  if (emissions < 200) return { level: "Low", color: "bg-green-500" };
  if (emissions < 400)
    return { level: "Moderately Low", color: "bg-yellow-500" };
  if (emissions < 600)
    return { level: "Moderately High", color: "bg-orange-500" };
  return { level: "High", color: "bg-red-500" };
};

const emissionInfo = getEmissionLevel(carbonEmissions);

export default function EnergyUsage() {
  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Carbon Emissions &amp; Cost</CardTitle>
          <CardDescription>
            Current CO₂ emissions and charging price overview.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-between gap-6">
          <div className="flex flex-col items-center justify-center p-6 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Carbon Emissions (kg CO₂e)
            </p>
            <p className="text-5xl font-bold tracking-tighter">
              {carbonEmissions}
            </p>
            <Badge
              className={`${emissionInfo.color} mt-2 text-white hover:${emissionInfo.color}`}
            >
              {emissionInfo.level}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-semibold">$0.15/kWh</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/50">
              <p className="text-sm text-primary">Discounted Price</p>
              <p className="text-2xl font-semibold text-primary">$0.11/kWh</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Renewable Energy Mix</CardTitle>
          <CardDescription>
            Distribution of renewable energy sources for charging.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ChartContainer
            config={chartConfig}
            className="h-[280px] w-full max-w-[280px]"
          >
            <PieChart accessibilityLayer>
              <Tooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={energyData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                innerRadius={80}
                paddingAngle={5}
                labelLine={false}
              >
                {energyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
