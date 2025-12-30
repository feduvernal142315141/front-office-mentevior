"use client"

import { useAuth } from "@/lib/hooks/use-auth";

export default function DashboardPage() {
  const { user } = useAuth();
  console.log("Authenticated user:", user);
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your dashboard!</p>
    </div>
  );
}