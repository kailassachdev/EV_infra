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
import { PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
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

const consumptionData = [
    { date: "2024-07-01", kWh: 28 }, { date: "2024-07-02", kWh: 30 },
    { date: "2024-07-03", kWh: 25 }, { date: "2024-07-04", kWh: 32 },
    { date: "2024-07-05", kWh: 35 }, { date: "2024-07-06", kWh: 38 },
    { date: "2024-07-07", kWh: 40 }, { date: "2024-07-08", kWh: 37 },
    { date: "2024-07-09", kWh: 33 }, { date: "2024-07-10", kWh: 31 },
    { date: "2024-07-11", kWh: 29 }, { date: "2024-07-12", kWh: 34 },
    { date: "2024-07-13", kWh: 36 }, { date: "2024-07-14", kWh: 41 },
    { date: "2024-07-15", kWh: 45 }, { date: "2024-07-16", kWh: 42 },
    { date: "2024-07-17", kWh: 39 }, { date: "2024-07-18", kWh: 43 },
    { date: "2024-07-19", kWh: 47 }, { date: "2024-07-20", kWh: 50 },
    { date: "2024-07-21", kWh: 48 }, { date: "2024-07-22", kWh: 46 },
    { date: "2024-07-23", kWh: 44 }, { date: "2024-07-24", kWh: 49 },
    { date: "2024-07-25", kWh: 52 }, { date: "2024-07-26", kWh: 55 },
    { date: "2024-07-27", kWh: 53 }, { date: "2024-07-28", kWh: 51 },
    { date: "2024-07-29", kWh: 54 }, { date: "2024-07-30", kWh: 58 },
];

const consumptionChartConfig = {
  kWh: {
    label: "kWh",
    color: "hsl(var(--chart-1))",
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
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
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
      <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Energy Consumption Trend</CardTitle>
            <CardDescription>
              Energy consumed over the last 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={consumptionChartConfig} className="h-[280px] w-full">
              <AreaChart
                data={consumptionData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                />
                 <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${value} kWh`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="kWh"
                  type="monotone"
                  fill="var(--color-kWh)"
                  fillOpacity={0.4}
                  stroke="var(--color-kWh)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
    </div>
  );
}
