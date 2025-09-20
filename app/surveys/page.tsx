"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  Building
} from "lucide-react";

const surveyModules = [
  {
    title: "Inspection Creation",
    icon: ClipboardCheck,
    href: "/surveys/inspection-creation",
    color: "text-blue-500",
    description: "Create and manage inspection surveys"
  },
  {
    title: "Warehouse Creation",
    icon: Building,
    href: "/surveys/warehouse-creation",
    color: "text-green-500",
    description: "Set up new warehouse facilities"
  }
];

export default function SurveysPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Back Button and Centered Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="inline-block text-lg font-semibold tracking-tight bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors"
            >
              ← Dashboard
            </button>
          </div>
          
          {/* Centered Title with Light Orange Background */}
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-orange-600 inline-block border-b-4 border-green-500 pb-2 px-6 py-3 bg-orange-100 rounded-lg">
              Survey
            </h1>
          </div>
          
          {/* Empty div for spacing */}
          <div className="w-32"></div>
        </div>
        
        {/* Survey Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {surveyModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link key={module.title} href={module.href} className="w-full">
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 h-full">
                  <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center h-full">
                    <div className="p-3 rounded-lg bg-white shadow-sm">
                      <Icon className={`w-8 h-8 ${module.color}`} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-300 pb-1">
                        {module.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {module.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Additional Info Section */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">i</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Survey Management</h4>
              <p className="text-sm text-blue-700 mt-1">
                Create and manage warehouse surveys including inspections and facility setup. 
                Use these tools to maintain quality standards and operational efficiency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}