"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Zap, Settings, TrendingUp } from "lucide-react";

export default function MaintenanceSchedule() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<number | null>(null);

  // Generate random station IDs
  const generateRandomStationId = () => {
    const prefix = ['EV', 'CH', 'ST', 'CS'][Math.floor(Math.random() * 4)];
    const number = Math.floor(Math.random() * 999) + 1;
    return `${prefix}-${String(number).padStart(3, '0')}`;
  };

  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      setError(null);
      setStations([]);
      setChecked(null);
      try {
        const res = await fetch("http://127.0.0.1:8000/maintenance/nearby");
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
        setStations(data.results);
        setChecked(data.stations_checked);
      } catch (e: any) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchStations();
  }, []);

  const maintenanceNeeded = stations.filter(station => station.needs_maintenance).length;
  const operational = stations.length - maintenanceNeeded;
  const avgLifespan = stations.length > 0 
    ? stations.reduce((sum, station) => sum + (station.estimated_life_months || 0), 0) / stations.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            EV Charger Maintenance Dashboard
          </h1>
          <p className="text-gray-600">
            AI-powered maintenance predictions and monitoring for charging infrastructure
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Stations</p>
                  <p className="text-2xl font-bold">{checked || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Operational</p>
                  <p className="text-2xl font-bold text-green-600">{operational}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Needs Maintenance</p>
                  <p className="text-2xl font-bold text-red-600">{maintenanceNeeded}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg. Lifespan</p>
                  <p className="text-2xl font-bold">{avgLifespan.toFixed(1)}mo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table */}
        <Card className="bg-white shadow-sm border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-xl">Station Status Overview</CardTitle>
            </div>
            <CardDescription>
              Detailed maintenance status and predictions for all monitored charging stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading station data...</span>
              </div>
            )}
            
            {error && (
              <div className="flex items-center justify-center py-8 text-red-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-900">Station ID</th>
                      <th className="text-left p-3 font-semibold text-gray-900">Energy (kWh)</th>
                      <th className="text-left p-3 font-semibold text-gray-900">Duration</th>
                      <th className="text-left p-3 font-semibold text-gray-900">Status</th>
                      <th className="text-left p-3 font-semibold text-gray-900">Maintenance Reason</th>
                      <th className="text-left p-3 font-semibold text-gray-900">Est. Life</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          <Settings className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <div>No station data available</div>
                        </td>
                      </tr>
                    ) : (
                      stations.map((item, idx) => (
                        <tr 
                          key={idx} 
                          className={`hover:bg-gray-50 transition-colors ${
                            item.needs_maintenance ? "bg-red-50 border-l-4 border-red-500" : "border-b"
                          }`}
                        >
                          <td className="p-3 font-mono font-medium">
                            {generateRandomStationId()}
                          </td>
                          <td className="p-3 font-medium">
                            {item.El_kWh}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {item.Duration_hours}h
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={item.needs_maintenance ? "destructive" : "default"}
                              className={
                                item.needs_maintenance
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-green-100 text-green-700 border-green-200"
                              }
                            >
                              {item.needs_maintenance ? (
                                <>
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Maintenance Required
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Operational
                                </>
                              )}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-600">
                            {item.reason || "—"}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4 text-gray-400" />
                              {item.estimated_life_months !== null 
                                ? `${item.estimated_life_months} months`
                                : "—"
                              }
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}