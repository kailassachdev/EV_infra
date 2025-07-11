"use client";

import { useEffect, useState } from "react";
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
import { PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Sector } from "recharts";
import { Badge } from "./ui/badge";
import { BASE_URL } from "@/config/api_config";
import { getEnergyMixData } from "@/services/gemini";

interface CarbonIntensityData {
  zone: string;
  timestamp: string;
  carbon_intensity: number;
  classification: string;
  suggested_price_per_kWh: number;
}

interface EnergyMixData {
  name: string;
  value: number;
  color: string;
}

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

// Enhanced color scheme with gradients
const COLORS = {
  Solar: ["#ffd700", "#ff8c00"],    // Gold to Orange
  Wind: ["#87ceeb", "#4169e1"],     // Sky Blue to Royal Blue
  Hydro: ["#00ffff", "#0000ff"],    // Cyan to Blue
  Geothermal: ["#ff4d4d", "#8b0000"] // Bright Red to Dark Red
};

const RADIAN = Math.PI / 180;
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value, name
  } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" className="text-lg font-bold">
        {name}
      </text>
      <text x={cx} y={cy} dy={10} textAnchor="middle" className="text-2xl font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.8}
      />
    </g>
  );
};

export default function EnergyUsage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [carbonData, setCarbonData] = useState<CarbonIntensityData | null>(null);
  const [energyMixData, setEnergyMixData] = useState<EnergyMixData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both carbon intensity and energy mix data
        const [carbonResponse, mixData] = await Promise.all([
          fetch(`${BASE_URL}/carbon-intensity`),
          getEnergyMixData()
        ]);

        if (!carbonResponse.ok) {
          throw new Error('Failed to fetch carbon intensity data');
        }

        const carbonData = await carbonResponse.json();
        setCarbonData(carbonData);
        // Ensure mixData is an array and has the correct structure
        if (Array.isArray(mixData) && mixData.length > 0) {
          setEnergyMixData(mixData);
        } else {
          console.error('Invalid energy mix data:', mixData);
          setEnergyMixData(energyData); // Use default data if invalid
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setEnergyMixData(energyData); // Use default data on error
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Add safety check for rendering
  if (isLoading || !energyMixData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carbon Emissions &amp; Cost</CardTitle>
          <CardDescription>Loading data...</CardDescription>
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
              {carbonData?.carbon_intensity}
            </p>
            <Badge
              className={`bg-${carbonData?.classification === 'Very Low' ? 'green' : 'yellow'}-500 mt-2 text-black`}
            >
              {carbonData?.classification}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-semibold">₹8.50/kWh</p>
            </div>
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/50">
              <p className="text-sm text-primary">Discounted Price</p>
              <p className="text-2xl font-semibold text-primary">₹{carbonData?.suggested_price_per_kWh.toFixed(2)}/kWh</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
            Renewable Energy Mix
          </CardTitle>
          <CardDescription className="text-base">
            Real-time distribution of renewable energy sources
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <ChartContainer
            config={chartConfig}
            className="h-[350px] w-full max-w-[350px]"
          >
            <PieChart>
              <defs>
                {energyMixData.map((entry, index) => {
                  // Add null check and type safety for COLORS access
                  const sourceColors = COLORS[entry.name as keyof typeof COLORS];
                  if (!sourceColors) return null;
                  
                  return (
                    <linearGradient key={`gradient-${index}`} id={`gradient-${entry.name}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={sourceColors[0]} />
                      <stop offset="100%" stopColor={sourceColors[1]} />
                    </linearGradient>
                  );
                })}
              </defs>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="rounded-xl bg-white/90 backdrop-blur-sm p-3 shadow-lg border border-slate-200 dark:bg-slate-900/90 dark:border-slate-700">
                        <p className="text-lg font-semibold">{data.name}</p>
                        <p className="text-base text-muted-foreground">
                          {data.value}% of total
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={energyMixData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={140}
                innerRadius={80}
                paddingAngle={8}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={onPieEnter}
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {energyMixData.map((entry, index) => {
                  const sourceColors = COLORS[entry.name as keyof typeof COLORS];
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={sourceColors ? `url(#gradient-${entry.name})` : entry.color} 
                    />
                  );
                })}
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
