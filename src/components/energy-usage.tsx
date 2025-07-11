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
import { PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, Legend, Sector } from "recharts";
import { Badge } from "./ui/badge";
import { BASE_URL } from "@/config/api_config";
import Papa from "papaparse";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getEnergyMixData } from "@/services/gemini";

interface MonthlyData {
  date: string;
  renewableCO2: number;
  nonRenewableCO2: number;
  totalEnergy: number;
}

interface CarbonIntensityData {
  zone: string;
  timestamp: string;
  carbon_intensity: number;
  classification: string;
  suggested_price_per_kWh: number;
}

interface EnergyData {
  date: string;
  renewableCO2: number;
  nonRenewableCO2: number;
  totalEnergy: number;
}

// Average tree absorbs about 22kg of CO2 per year
const KG_CO2_PER_TREE_PER_YEAR = 22;
// Baseline carbon intensity for tree calculation (in tons CO2)
const BASELINE_CO2_YEARLY = 950; // Using 2020's non-renewable value as baseline

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
    label: "Carbon Intensity",
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
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearlyData, setYearlyData] = useState<MonthlyData[]>([]);
  const [csvLoading, setCsvLoading] = useState(true);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');

  // Calculate trees saved based on CO2 reduction
  const calculateTreesSaved = (data: MonthlyData[]) => {
    if (data.length === 0) return 0;
    
    if (timeframe === 'yearly') {
      // For yearly view, compare latest year's non-renewable to baseline
      const latestYear = data[data.length - 1];
      const reductionTons = BASELINE_CO2_YEARLY - latestYear.nonRenewableCO2;
      return Math.round((reductionTons * 1000) / KG_CO2_PER_TREE_PER_YEAR);
    } else {
      // For monthly view, compare average monthly non-renewable to baseline/12
      const monthlyBaseline = BASELINE_CO2_YEARLY / 12;
      const avgMonthlyNonRenewable = data.reduce((sum, item) => sum + item.nonRenewableCO2, 0) / data.length;
      const reductionTons = monthlyBaseline - avgMonthlyNonRenewable;
      return Math.round((reductionTons * 1000) / (KG_CO2_PER_TREE_PER_YEAR / 12));
    }
  };

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

  useEffect(() => {
    // Fetch monthly data
    fetch("/monthly.csv")
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load monthly data');
        }
        return response.text();
      })
      .then(csvText => {
        Papa.parse<any>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error('CSV parsing errors:', results.errors);
              setCsvError('Error parsing monthly data');
              return;
            }
            
            const data = results.data.map((row: any) => ({
              date: row["Datetime (UTC)"],
              renewableCO2: parseFloat(row["Renewable CO2 (tons)"]) || 0,
              nonRenewableCO2: parseFloat(row["Non-Renewable CO2 (tons)"]) || 0,
              totalEnergy: parseFloat(row["Total Energy (MWh)"]) || 0
            }));
            setMonthlyData(data);
          },
          error: (error: Error) => {
            console.error('CSV parsing error:', error);
            setCsvError(error.message);
          },
        });
      })
      .catch(err => {
        console.error('Failed to load monthly data:', err);
        setCsvError(err instanceof Error ? err.message : 'Failed to load monthly data');
      });

    // Fetch yearly data
    fetch("/yearly.csv")
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load yearly data');
        }
        return response.text();
      })
      .then(csvText => {
        Papa.parse<any>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error('CSV parsing errors:', results.errors);
              setCsvError('Error parsing yearly data');
              return;
            }

            const data = results.data.map((row: any) => ({
              date: row["Datetime (UTC)"],
              renewableCO2: parseFloat(row["Renewable CO2 (tons)"]) || 0,
              nonRenewableCO2: parseFloat(row["Non-Renewable CO2 (tons)"]) || 0,
              totalEnergy: parseFloat(row["Total Energy (MWh)"]) || 0
            }));
            setYearlyData(data);
            setCsvLoading(false);
          },
          error: (error: Error) => {
            console.error('CSV parsing error:', error);
            setCsvError(error.message);
            setCsvLoading(false);
          },
        });
      })
      .catch(err => {
        console.error('Failed to load yearly data:', err);
        setCsvError(err instanceof Error ? err.message : 'Failed to load yearly data');
        setCsvLoading(false);
      });
  }, []);

  const currentData = timeframe === 'monthly' ? monthlyData : yearlyData;
  const treesSaved = calculateTreesSaved(currentData);

  if (isLoading) {
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
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Energy Source Comparison</CardTitle>
                <CardDescription>
                  {timeframe === 'monthly' ? 'Monthly' : 'Yearly'} renewable vs non-renewable energy usage and CO₂ impact
                </CardDescription>
              </div>
              <Select
                value={timeframe}
                onValueChange={(value: 'monthly' | 'yearly') => setTimeframe(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly View</SelectItem>
                  <SelectItem value="yearly">Yearly View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-start space-x-2 text-sm">
              <Badge variant="outline" className="bg-green-100">
                🌳 Equivalent to {treesSaved} trees planted
              </Badge>
              <span className="text-muted-foreground">(based on carbon reduction)</span>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={consumptionChartConfig} className="h-[280px] w-full">
                {csvLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading data...</p>
                  </div>
                ) : csvError ? (
                  <div className="flex items-center justify-center h-full text-red-500">
                    <p>{csvError}</p>
                  </div>
                ) : (
                  <BarChart
                    data={currentData}
                    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tickMargin={20}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                        month: timeframe === 'yearly' ? undefined : 'short',
                        year: 'numeric'
                      })}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      label={{ value: 'CO₂ (tons)', angle: -90, position: 'insideLeft', offset: -20 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const renewable = Number(payload[0]?.value ?? 0);
                          const nonRenewable = Number(payload[1]?.value ?? 0);
                          const total = renewable + nonRenewable;
                          const date = new Date(payload[0]?.payload?.date).toLocaleDateString('en-US', {
                            month: timeframe === 'yearly' ? undefined : 'long',
                            year: 'numeric'
                          });
                          
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="text-sm font-medium mb-2">{date}</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-green-500" />
                                  <span className="text-sm font-medium">Renewable</span>
                                </div>
                                <div className="text-sm text-right">{renewable.toFixed(1)} tons</div>
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-2 rounded-full bg-red-500" />
                                  <span className="text-sm font-medium">Non-Renewable</span>
                                </div>
                                <div className="text-sm text-right">{nonRenewable.toFixed(1)} tons</div>
                                <div className="col-span-2 border-t pt-1 mt-1">
                                  <div className="text-xs text-muted-foreground">
                                    Total CO₂: {total.toFixed(1)} tons
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar
                      dataKey="renewableCO2"
                      name="Renewable"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="nonRenewableCO2"
                      name="Non-Renewable"
                      fill="#ef4444"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )}
              </ChartContainer>
          </CardContent>
        </Card>
    </div>
  );
}
