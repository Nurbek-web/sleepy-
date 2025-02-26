"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TestResult, SleepEntry, User } from "@/types";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from "recharts";

type Difficulty = "easy" | "medium" | "hard";
type DifficultyStats = {
  [K in Difficulty]: {
    count: number;
    avgScore: number;
  };
};

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [sleepData, setSleepData] = useState<SleepEntry[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  const fetchData = useCallback(async () => {
    try {
      // Fetch students
      const studentsQuery = query(
        collection(db, "users"),
        where("role", "==", "student")
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) =>
          ({ id: doc.id, ...doc.data() } as User)
      );
      setStudents(studentsData);

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (timeRange === "week") startDate.setDate(now.getDate() - 7);
      if (timeRange === "month") startDate.setMonth(now.getMonth() - 1);

      // Fetch test results
      const testQuery = query(
        collection(db, "testResults"),
        where("startTime", ">=", Timestamp.fromDate(startDate)),
        orderBy("startTime", "desc")
      );
      const testSnapshot = await getDocs(testQuery);
      const testData = testSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) =>
          ({ id: doc.id, ...doc.data() } as TestResult)
      );
      setTestResults(testData);

      // Fetch sleep entries
      const sleepQuery = query(
        collection(db, "sleepEntries"),
        where("date", ">=", startDate),
        orderBy("date", "desc")
      );
      const sleepSnapshot = await getDocs(sleepQuery);
      const sleepData = sleepSnapshot.docs.map(
        (doc: QueryDocumentSnapshot<DocumentData>) =>
          ({ id: doc.id, ...doc.data() } as SleepEntry)
      );
      setSleepData(sleepData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, timeRange, fetchData]);

  const calculateAverages = () => {
    const averages = students.map((student) => {
      const studentTests = testResults.filter(
        (test) => test.userId === student.id
      );
      const studentSleep = sleepData.filter(
        (entry) => entry.userId === student.id
      );

      return {
        name: student.name,
        avgScore:
          studentTests.reduce((acc, test) => acc + test.adjustedScore, 0) /
            studentTests.length || 0,
        avgSleep:
          studentSleep.reduce(
            (acc, entry) =>
              acc +
              (new Date(entry.wakeTime).getTime() -
                new Date(entry.bedTime).getTime()) /
                (1000 * 60 * 60),
            0
          ) / studentSleep.length || 0,
        avgQuality:
          studentSleep.reduce((acc, entry) => acc + entry.sleepQuality, 0) /
            studentSleep.length || 0,
      };
    });

    return averages;
  };

  const getDifficultyStats = () => {
    const stats: DifficultyStats = {
      easy: { count: 0, avgScore: 0 },
      medium: { count: 0, avgScore: 0 },
      hard: { count: 0, avgScore: 0 },
    };

    testResults.forEach((test) => {
      stats[test.difficulty].count++;
      stats[test.difficulty].avgScore += test.adjustedScore;
    });

    (Object.keys(stats) as Difficulty[]).forEach((diff) => {
      if (stats[diff].count > 0) {
        stats[diff].avgScore /= stats[diff].count;
      }
    });

    return stats;
  };

  const exportData = () => {
    const data = {
      testResults,
      sleepData,
      students,
      analytics: {
        averages: calculateAverages(),
        difficultyStats: getDifficultyStats(),
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${new Date().toISOString()}.json`;
    a.click();
  };

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="space-x-4">
          <Button
            variant={timeRange === "week" ? "default" : "outline"}
            onClick={() => setTimeRange("week")}
          >
            Last Week
          </Button>
          <Button
            variant={timeRange === "month" ? "default" : "outline"}
            onClick={() => setTimeRange("month")}
          >
            Last Month
          </Button>
          <Button
            variant={timeRange === "all" ? "default" : "outline"}
            onClick={() => setTimeRange("all")}
          >
            All Time
          </Button>
          <Button onClick={exportData}>Export Data</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              width={400}
              height={300}
              data={Object.entries(getDifficultyStats()).map(
                ([diff, stats]) => ({
                  difficulty: diff,
                  avgScore: stats.avgScore,
                  count: stats.count,
                })
              )}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="difficulty" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avgScore" fill="#8884d8" name="Average Score" />
              <Bar dataKey="count" fill="#82ca9d" name="Number of Tests" />
            </BarChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sleep Quality vs Test Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ScatterChart width={400} height={300}>
              <CartesianGrid />
              <XAxis dataKey="sleepQuality" name="Sleep Quality" />
              <YAxis dataKey="testScore" name="Test Score" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                name="Students"
                data={calculateAverages().map((student) => ({
                  sleepQuality: student.avgQuality,
                  testScore: student.avgScore,
                  name: student.name,
                }))}
                fill="#8884d8"
              />
            </ScatterChart>
          </CardContent>
        </Card>

        {/* Add more visualization cards as needed */}
      </div>
    </div>
  );
}
