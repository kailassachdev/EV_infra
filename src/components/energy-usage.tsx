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
import { Zap, TrendingUp, Leaf, DollarSign, Activity } from "lucide-react";

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

const KG_CO2_PER_TREE_PER_YEAR = 22;
const BASELINE_CO2_YEARLY = 950;

interface EnergyMixData {
  name: string;
  value: number;
  color: string;
}

const energyData = [
  { name: "Hydro", value: 15.5, color: "#06b6d4" },
  { name: "Solar", value: 18.85, color: "#facc15" },
  { name: "Wind", value: 12, color: "#3b82f6" },
  { name: "Coal", value: 53.65, color: "#6b7280" },
];

const chartConfig = {
  value: { label: "Energy %" },
  hydro: { label: "Hydro", color: "#06b6d4" },
  solar: { label: "Solar", color: "#facc15" },
  wind: { label: "Wind", color: "#3b82f6" },
  coal: { label: "Coal", color: "#6b7280" },
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
  kWh: { label: "Carbon Intensity", color: "#3b82f6" },
} satisfies ChartConfig;

const COLORS = {
  Hydro: "#06b6d4",
  Solar: "#facc15",
  Wind: "#3b82f6", 
  Coal: "#6b7280"
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, name } = props;
  
  return (
    <g>
      <text x={cx} y={cy} dy={-10} textAnchor="middle" className="text-sm font-medium fill-gray-700">
        {name}
      </text>
      <text x={cx} y={cy} dy={15} textAnchor="middle" className="text-2xl font-bold fill-gray-900">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
    </g>
  );
};

export default function EnergyUsage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [carbonData, setCarbonData] = useState<CarbonIntensityData | null>(null);
  const [energyMixData, setEnergyMixData] = useState<EnergyMixData[]>(energyData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearlyData, setYearlyData] = useState<MonthlyData[]>([]);
  const [csvLoading, setCsvLoading] = useState(true);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');

  const calculateTreesSaved = (data: MonthlyData[]) => {
    if (data.length === 0) return 0;
    
    if (timeframe === 'yearly') {
      const latestYear = data[data.length - 1];
      const reductionTons = BASELINE_CO2_YEARLY - latestYear.nonRenewableCO2;
      return Math.round((reductionTons * 1000) / KG_CO2_PER_TREE_PER_YEAR);
    } else {
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
        const carbonResponse = await fetch(`${BASE_URL}/carbon-intensity`);

        if (!carbonResponse.ok) {
          throw new Error('Failed to fetch carbon intensity data');
        }

        const carbonData = await carbonResponse.json();
        setCarbonData(carbonData);
        
        // Always use hardcoded energy mix data
        setEnergyMixData(energyData);
        setIsLoading(false);
      } catch (err) {
        console.log('Error fetching carbon data, using default energy mix');
        setEnergyMixData(energyData);
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
        if (!response.ok) throw new Error('Failed to load monthly data');
        return response.text();
      })
      .then(csvText => {
        Papa.parse<any>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
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
          error: (error: Error) => setCsvError(error.message),
        });
      })
      .catch(err => setCsvError(err instanceof Error ? err.message : 'Failed to load monthly data'));

    // Fetch yearly data
    fetch("/yearly.csv")
      .then(response => {
        if (!response.ok) throw new Error('Failed to load yearly data');
        return response.text();
      })
      .then(csvText => {
        Papa.parse<any>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
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
            setCsvError(error.message);
            setCsvLoading(false);
          },
        });
      })
      .catch(err => {
        setCsvError(err instanceof Error ? err.message : 'Failed to load yearly data');
        setCsvLoading(false);
      });
  }, []);

  const currentData = timeframe === 'monthly' ? monthlyData : yearlyData;
  const treesSaved = calculateTreesSaved(currentData);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-80"></div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
              <div className="h-80 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">System Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Energy Pricing Optimization
          </h1>
          <p className="text-gray-600">
            Real-time carbon emissions monitoring and renewable energy insights
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-4">
          
          {/* Carbon Metrics - Larger component */}
          <div className="md:col-span-2">
            <Card className="bg-white shadow-sm border-gray-200 h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Carbon Metrics & Pricing</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Carbon Intensity</p>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {carbonData?.carbon_intensity}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">g CO₂e/kWh</p>
                  <Badge
                    variant="outline"
                    className={
                      carbonData?.classification === 'Very Low' 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }
                  >
                    {carbonData?.classification}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <DollarSign className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Standard Price</p>
                    <p className="text-2xl font-semibold">₹8.50</p>
                    <p className="text-xs text-gray-400">per kWh</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-600 mb-1">Optimized Price</p>
                    <p className="text-2xl font-semibold text-blue-700">₹{carbonData?.suggested_price_per_kWh.toFixed(2)}</p>
                    <p className="text-xs text-blue-500">per kWh</p>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Price Optimization</span>
                  </div>
                  <p className="text-sm text-green-600">
                    Dynamic pricing based on real-time carbon intensity. 
                    Lower prices when renewable energy is abundant.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Stacked components */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Energy Mix */}
            <Card className="bg-white shadow-sm border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">Energy Mix</CardTitle>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  Current distribution of renewable energy sources in your region
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ChartContainer config={chartConfig} className="h-[200px] w-full">
                  {energyMixData.length > 0 ? (
                    <PieChart>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-white p-2 shadow-lg border rounded-lg">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm text-gray-600">{data.value}%</p>
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
                        outerRadius={70}
                        innerRadius={40}
                        paddingAngle={3}
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={onPieEnter}
                      >
                        {energyMixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                      </Pie>
                    </PieChart>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Energy Analysis */}
            <Card className="bg-white shadow-sm border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-lg">CO2 Emissions</CardTitle>
                  </div>
                  <Select value={timeframe} onValueChange={(value: 'monthly' | 'yearly') => setTimeframe(value)}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  Historical CO₂ emissions comparison between renewable and non-renewable sources
                </CardDescription>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-fit">
                  {treesSaved} trees equivalent
                </Badge>
              </CardHeader>
              <CardContent>
                <ChartContainer config={consumptionChartConfig} className="h-[180px] w-full">
                  {csvLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : csvError ? (
                    <div className="flex items-center justify-center h-full text-red-500 text-sm">
                      {csvError}
                    </div>
                  ) : (
                    <BarChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                          month: timeframe === 'yearly' ? undefined : 'short',
                          year: 'numeric'
                        })}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const renewable = Number(payload[0]?.value ?? 0);
                            const nonRenewable = Number(payload[1]?.value ?? 0);
                            const date = new Date(payload[0]?.payload?.date).toLocaleDateString('en-US', {
                              month: timeframe === 'yearly' ? undefined : 'long',
                              year: 'numeric'
                            });
                            
                            return (
                              <div className="bg-white p-3 shadow-lg border rounded-lg">
                                <p className="font-medium mb-2">{date}</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                                      <span className="text-sm">Renewable</span>
                                    </div>
                                    <span className="text-sm font-medium">{renewable.toFixed(1)}t</span>
                                  </div>
                                  <div className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                                      <span className="text-sm">Non-Renewable</span>
                                    </div>
                                    <span className="text-sm font-medium">{nonRenewable.toFixed(1)}t</span>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Bar dataKey="renewableCO2" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="nonRenewableCO2" fill="#ef4444" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  )}
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}