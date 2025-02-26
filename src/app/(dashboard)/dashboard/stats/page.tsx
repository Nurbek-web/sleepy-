"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TestResult, SleepEntry } from "@/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface StatsData {
  date: string;
  testScore: number;
  sleepDuration: number;
  sleepQuality: number;
  alertness: number;
}

function getDateString(date: Date | { seconds: number; nanoseconds: number }) {
  if ("seconds" in date) {
    // Handle Firestore Timestamp
    return new Date(date.seconds * 1000).toISOString().split("T")[0];
  }
  // Handle regular Date object
  return date.toISOString().split("T")[0];
}

export default function StatsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statsData, setStatsData] = useState<StatsData[]>([]);
  const [averages, setAverages] = useState({
    testScore: 0,
    sleepDuration: 0,
    sleepQuality: 0,
    alertness: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch test results
      const testQuery = query(
        collection(db, "testResults"),
        where("userId", "==", user!.id),
        orderBy("startTime", "desc")
      );
      const testSnapshot = await getDocs(testQuery);
      const testResults = testSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })
      ) as TestResult[];

      // Fetch sleep entries
      const sleepQuery = query(
        collection(db, "sleepEntries"),
        where("userId", "==", user!.id),
        orderBy("date", "desc")
      );
      const sleepSnapshot = await getDocs(sleepQuery);
      const sleepEntries = sleepSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) => ({
          id: doc.id,
          ...doc.data(),
        })
      ) as SleepEntry[];

      // Process and combine data
      const dateMap = new Map<string, StatsData>();

      // Process test results
      testResults.forEach((test) => {
        try {
          const date = getDateString(test.startTime);
          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date,
              testScore: test.score,
              sleepDuration: 0,
              sleepQuality: 0,
              alertness: test.alertnessRating,
            });
          }
        } catch (err) {
          console.error("Error processing test result:", err);
        }
      });

      // Process sleep entries
      sleepEntries.forEach((sleep) => {
        try {
          const date = getDateString(sleep.date);
          const existing = dateMap.get(date) || {
            date,
            testScore: 0,
            sleepDuration: 0,
            sleepQuality: 0,
            alertness: 0,
          };

          existing.sleepDuration = sleep.sleepDuration;
          existing.sleepQuality = sleep.sleepQuality;
          dateMap.set(date, existing);
        } catch (err) {
          console.error("Error processing sleep entry:", err);
        }
      });

      // Convert map to array and sort by date
      const sortedData = Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      // Calculate averages
      const avgData = sortedData.reduce(
        (acc, curr) => ({
          testScore: acc.testScore + curr.testScore,
          sleepDuration: acc.sleepDuration + curr.sleepDuration,
          sleepQuality: acc.sleepQuality + curr.sleepQuality,
          alertness: acc.alertness + curr.alertness,
        }),
        { testScore: 0, sleepDuration: 0, sleepQuality: 0, alertness: 0 }
      );

      const dataLength = sortedData.length || 1;
      setAverages({
        testScore: avgData.testScore / dataLength,
        sleepDuration: avgData.sleepDuration / dataLength,
        sleepQuality: avgData.sleepQuality / dataLength,
        alertness: avgData.alertness / dataLength,
      });

      setStatsData(sortedData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load statistics");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Statistics...</h2>
          <p className="text-gray-500">
            Please wait while we gather your data.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">Performance Statistics</h1>

      {/* Averages Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Average Test Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {averages.testScore.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Sleep Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {averages.sleepDuration.toFixed(1)}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Sleep Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {averages.sleepQuality.toFixed(1)}/5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Alertness</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {averages.alertness.toFixed(1)}/5
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="space-y-8">
        {/* Test Scores and Alertness Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Test Performance and Alertness Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="testScore"
                  stroke="#8884d8"
                  name="Test Score"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="alertness"
                  stroke="#82ca9d"
                  name="Alertness"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sleep Duration and Quality Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sleep Patterns Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sleepDuration"
                  stroke="#8884d8"
                  name="Sleep Duration (hours)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sleepQuality"
                  stroke="#82ca9d"
                  name="Sleep Quality"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
