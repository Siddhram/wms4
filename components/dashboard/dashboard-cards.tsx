"use client";

import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  Warehouse,
  ClipboardCheck,
  PackageCheck,
  Truck,
  Box,
  ArrowRightLeft,
  FileText,
  Database,
  Users,
  Shield
} from "lucide-react";

const dashboardCards = [
  {
    title: "Survey",
    icon: ClipboardCheck,
    href: "/surveys",
    color: "text-green-500",
  },
  {
    title: "Inward",
    icon: PackageCheck,
    href: "/inward",
    color: "text-yellow-500",
  },
  {
    title: "Release Order",
    icon: ArrowRightLeft,
    href: "/ro",
    color: "text-purple-500",
  },
  {
    title: "Delivery Order",
    icon: Truck,
    href: "/delivery-order",
    color: "text-pink-500",
  },
  {
    title: "Outward",
    icon: Box,
    href: "/outward",
    color: "text-orange-500",
  },
  {
    title: "Reports",
    icon: FileText,
    href: "/reports",
    color: "text-red-500",
  },
  {
    title: "Master Data",
    icon: Database,
    href: "/master-data",
    color: "text-indigo-500",
  },
];

// Admin-only cards
const adminCards = [
  {
    title: "Admin Portal",
    icon: Shield,
    href: "/admin",
    color: "text-emerald-500",
  },
  {
    title: "User Management",
    icon: Users,
    href: "/admin/users",
    color: "text-cyan-500",
  },
];

export function DashboardCards() {
  const { user } = useAuth();
  
  // Combine regular cards with admin cards if user is admin
  const availableCards = user?.role === 'admin' 
    ? [...dashboardCards, ...adminCards] 
    : dashboardCards;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
      {availableCards.map((card) => {
        const Icon = card.icon;
        return (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-all duration-300 cursor-pointer bg-gray-100 rounded-lg border border-gray-200">
              <CardContent className="p-3 md:p-4 flex flex-col items-center justify-center space-y-2">
                <div className="p-2 md:p-2.5 rounded-md bg-white">
                  <Icon className={`w-6 h-6 md:w-8 md:h-8 ${card.color}`} />
                </div>
                <span className="text-xs md:text-sm font-medium text-center inline-block w-fit border-b border-green-500 pb-0.5">
                  {card.title}
                </span>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
