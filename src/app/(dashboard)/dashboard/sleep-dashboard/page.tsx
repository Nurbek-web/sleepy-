"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSleepEntries } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";

interface SleepEntry {
  id: string;
  date: Date;
  bedTime: Date;
  wakeTime: Date;
  sleepDuration: number;
  sleepQuality: number;
  userId: string;
}

export default function SleepDashboardPage() {
  const { user } = useAuth();
  const [sleepData, setSleepData] = useState<SleepEntry[]>([]);

  useEffect(() => {
    const fetchSleepData = async () => {
      if (!user?.id) return;

      try {
        const entries = await getSleepEntries(user.id);
        setSleepData(entries);
      } catch (error) {
        console.error("Failed to fetch sleep data:", error);
      }
    };

    fetchSleepData();
  }, [user?.id]);

  const chartData = sleepData.map((entry) => ({
    date: format(new Date(entry.date), "MMM dd"),
    duration: entry.sleepDuration,
    quality: entry.sleepQuality,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sleep Dashboard</h1>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Sleep Duration Over Time
          </h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="duration"
                  stroke="#2563eb"
                  name="Sleep Duration (hours)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="quality"
                  stroke="#16a34a"
                  name="Sleep Quality"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sleep Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Average Sleep Duration
              </p>
              <p className="text-2xl font-bold">
                {chartData.length > 0
                  ? (
                      chartData.reduce((acc, curr) => acc + curr.duration, 0) /
                      chartData.length
                    ).toFixed(1)
                  : "N/A"}{" "}
                hrs
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Average Sleep Quality
              </p>
              <p className="text-2xl font-bold">
                {chartData.length > 0
                  ? (
                      chartData.reduce((acc, curr) => acc + curr.quality, 0) /
                      chartData.length
                    ).toFixed(1)
                  : "N/A"}
              </p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Entries
              </p>
              <p className="text-2xl font-bold">{chartData.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
