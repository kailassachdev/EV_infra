"use client";

import { Header } from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnergyUsage from "@/components/energy-usage";
import MaintenanceSchedule from "@/components/maintenance-schedule";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const NewLocations = dynamic(() => import('@/components/new-locations'), {
  ssr: false,
  loading: () => (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[500px] w-full" />
      </CardContent>
    </Card>
  ),
});

// Removed dynamic import for NewStation

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <Tabs defaultValue="new-locations" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto md:h-10">
            <TabsTrigger value="new-locations">New Locations</TabsTrigger>
            <TabsTrigger value="energy-usage">Energy Usage</TabsTrigger>
            <TabsTrigger value="maintenance-schedule">Maintenance</TabsTrigger>
          </TabsList>
          <TabsContent value="new-locations" className="mt-4">
            <NewLocations />
          </TabsContent>
          <TabsContent value="energy-usage" className="mt-4">
            <EnergyUsage />
          </TabsContent>
          <TabsContent value="maintenance-schedule" className="mt-4">
            <MaintenanceSchedule />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
