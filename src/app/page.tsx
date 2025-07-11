"use client";

import { Header } from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FleetOverview from "@/components/fleet-overview";
import EnergyUsage from "@/components/energy-usage";
import MaintenanceSchedule from "@/components/maintenance-schedule";
import Reports from "@/components/reports";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="fleet-overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-10">
            <TabsTrigger value="fleet-overview">Fleet Overview</TabsTrigger>
            <TabsTrigger value="energy-usage">Energy Usage</TabsTrigger>
            <TabsTrigger value="maintenance-schedule">Maintenance</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="fleet-overview" className="mt-4">
            <FleetOverview />
          </TabsContent>
          <TabsContent value="energy-usage" className="mt-4">
            <EnergyUsage />
          </TabsContent>
          <TabsContent value="maintenance-schedule" className="mt-4">
            <MaintenanceSchedule />
          </TabsContent>
          <TabsContent value="reports" className="mt-4">
            <Reports />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
