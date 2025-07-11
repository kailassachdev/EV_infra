"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Wand2 } from "lucide-react";

const upcomingMaintenance = [
  {
    id: "EV-005",
    task: "Brake Fluid Check",
    dueDate: "2024-08-15",
    status: "Scheduled",
  },
  {
    id: "EV-003",
    task: "Tire Rotation",
    dueDate: "2024-08-22",
    status: "Scheduled",
  },
  {
    id: "EV-007",
    task: "Battery Health Analysis",
    dueDate: "2024-09-01",
    status: "Due Soon",
  },
];

const historyMaintenance = [
  {
    id: "EV-001",
    task: "Annual Inspection",
    completedDate: "2024-07-20",
    cost: "250.00",
  },
  {
    id: "EV-002",
    task: "Coolant System Flush",
    completedDate: "2024-07-18",
    cost: "150.00",
  },
  {
    id: "EV-004",
    task: "Software Update",
    completedDate: "2024-06-30",
    cost: "0.00",
  },
];

export default function MaintenanceSchedule() {
  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Tabs defaultValue="upcoming">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
                <CardDescription>
                  Tasks that are scheduled or due soon for vehicles in the
                  fleet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle ID</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingMaintenance.map((item) => (
                      <TableRow key={item.id + item.task}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.task}</TableCell>
                        <TableCell>{item.dueDate}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              item.status === "Due Soon"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance History</CardTitle>
                <CardDescription>
                  A log of all completed maintenance tasks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle ID</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Completed On</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyMaintenance.map((item) => (
                      <TableRow key={item.id + item.task}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.task}</TableCell>
                        <TableCell>{item.completedDate}</TableCell>
                        <TableCell className="text-right">
                          ${item.cost}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>AI-Powered Suggestions</CardTitle>
            <CardDescription>
              Use AI to analyze sensor data and suggest preventative
              maintenance.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
              Based on recent telemetry from EV-007, we've detected anomalous
              battery temperature fluctuations. It's recommended to schedule a
              'Battery Health Analysis' soon to prevent potential issues.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline">
              <Wand2 className="mr-2 h-4 w-4" />
              Get New AI Suggestions
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
