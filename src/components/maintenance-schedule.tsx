"use client";

import React, { useState, useEffect } from "react";
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

export default function MaintenanceSchedule() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<number | null>(null);

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

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-1">
      <Card>
        <CardHeader>
          <CardTitle>EV Charger Maintenance Status</CardTitle>
          <CardDescription>
            AI-powered maintenance predictions for nearby EV charging stations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checked !== null && (
            <span className="text-muted-foreground text-sm mb-2 block">{checked} stations checked</span>
          )}
          {loading && <div className="text-muted-foreground mb-2">Loading...</div>}
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>El_kWh</TableHead>
                  <TableHead>Duration (hrs)</TableHead>
                  <TableHead>Needs Maintenance</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Est. Life (months)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stations.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No data available.
                    </TableCell>
                  </TableRow>
                )}
                {stations.map((item, idx) => (
                  <TableRow key={idx} className={item.needs_maintenance ? "bg-red-50" : ""}>
                    <TableCell>{item.El_kWh}</TableCell>
                    <TableCell>{item.Duration_hours}</TableCell>
                    <TableCell>
                      {item.needs_maintenance ? (
                        <span className="text-red-600 font-semibold">Yes</span>
                      ) : (
                        <span className="text-green-600 font-semibold">No</span>
                      )}
                    </TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>
                      {item.estimated_life_months !== null ? item.estimated_life_months : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
