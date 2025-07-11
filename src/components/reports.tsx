"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import {
  Download,
  FileText,
  DollarSign,
  Droplets,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const reportData = [
  { vehicle: "EV-001", distance: "1,204 km", energy: "180.6 kWh", cost: "$27.09" },
  { vehicle: "EV-002", distance: "850 km", energy: "127.5 kWh", cost: "$19.13" },
  { vehicle: "EV-003", distance: "2,130 km", energy: "319.5 kWh", cost: "$47.93" },
  { vehicle: "EV-004", distance: "980 km", energy: "147.0 kWh", cost: "$22.05" },
];

export default function Reports() {
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
          <CardDescription>
            Generate and export operational reports for your fleet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="report-type" className="text-sm font-medium">
                Report Type
              </label>
              <Select defaultValue="cost-analysis">
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select a report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cost-analysis">Cost Analysis</SelectItem>
                  <SelectItem value="energy-usage">Energy Usage</SelectItem>
                  <SelectItem value="carbon-footprint">
                    Carbon Footprint
                  </SelectItem>
                  <SelectItem value="vehicle-utilization">
                    Vehicle Utilization
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label htmlFor="date-range" className="text-sm font-medium">
                Date Range
              </label>
              <Select defaultValue="last-30-days">
                <SelectTrigger id="date-range">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                  <SelectItem value="year-to-date">Year to Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => setShowReport(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </CardFooter>
      </Card>
      {showReport && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Cost Analysis Report</CardTitle>
              <CardDescription>July 2024</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Export as PDF</DropdownMenuItem>
                <DropdownMenuItem>Export as CSV</DropdownMenuItem>
                <DropdownMenuItem>Export as Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">$116.20</div>
                        <p className="text-xs text-muted-foreground">+5.2% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Energy Consumed</CardTitle>
                        <Droplets className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">774.6 kWh</div>
                        <p className="text-xs text-muted-foreground">+8.1% from last month</p>
                    </CardContent>
                </Card>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle ID</TableHead>
                  <TableHead>Distance Driven</TableHead>
                  <TableHead>Energy Used</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((item) => (
                  <TableRow key={item.vehicle}>
                    <TableCell className="font-medium">{item.vehicle}</TableCell>
                    <TableCell>{item.distance}</TableCell>
                    <TableCell>{item.energy}</TableCell>
                    <TableCell className="text-right">{item.cost}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
