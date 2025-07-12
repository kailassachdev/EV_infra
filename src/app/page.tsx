"use client";

import { Header } from "@/components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnergyUsage from "@/components/energy-usage";
import MaintenanceSchedule from "@/components/maintenance-schedule";
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Zap, Settings } from "lucide-react";

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

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="new-locations" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-10 bg-background border rounded-lg mb-6">
              <TabsTrigger 
                value="new-locations" 
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-muted data-[state=active]:shadow-sm"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">New Locations</span>
                <span className="sm:hidden">Locations</span>
              </TabsTrigger>
              <TabsTrigger 
                value="energy-usage" 
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-muted data-[state=active]:shadow-sm"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Energy Usage</span>
                <span className="sm:hidden">Energy</span>
              </TabsTrigger>
              <TabsTrigger 
                value="maintenance-schedule" 
                className="flex items-center gap-2 transition-all duration-200 data-[state=active]:bg-muted data-[state=active]:shadow-sm"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Maintenance</span>
                <span className="sm:hidden">Maintenance</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="relative">
              <TabsContent 
                value="new-locations" 
                className="mt-0 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-left-2 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-right-2 transition-all duration-300"
              >
                <NewLocations />
              </TabsContent>
              
              <TabsContent 
                value="energy-usage" 
                className="mt-0 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-left-2 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-right-2 transition-all duration-300"
              >
                <EnergyUsage />
              </TabsContent>
              
              <TabsContent 
                value="maintenance-schedule" 
                className="mt-0 data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0 data-[state=inactive]:slide-out-to-left-2 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-right-2 transition-all duration-300"
              >
                <MaintenanceSchedule />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
