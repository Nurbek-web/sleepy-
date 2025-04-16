"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TestResult, SleepEntry, User } from "@/types";
import { getAllStudents } from "@/lib/db";
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
import { useRouter } from "next/navigation";

type Difficulty = "easy" | "medium" | "hard" | "unknown";
type DifficultyStats = {
  [K in Difficulty]: {
    count: number;
    avgScore: number;
  };
};

export default function TeacherAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [sleepData, setSleepData] = useState<SleepEntry[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch students
      const studentsData = await getAllStudents();
      setStudents(studentsData);
      
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (timeRange === "week") startDate.setDate(now.getDate() - 7);
      if (timeRange === "month") startDate.setMonth(now.getMonth() - 1);
      if (timeRange === "year") startDate.setFullYear(now.getFullYear() - 1);
      
      // Create Firestore timestamp for query
      const firestoreStartDate = Timestamp.fromDate(startDate);
      
      // Fetch test results
      let testQuery;
      if (timeRange === "all") {
        testQuery = query(
          collection(db, "testResults"),
          orderBy("startTime", "desc")
        );
      } else {
        testQuery = query(
          collection(db, "testResults"),
          where("startTime", ">=", firestoreStartDate),
          orderBy("startTime", "desc")
        );
      }
      
      const testSnapshot = await getDocs(testQuery);
      const testData = testSnapshot.docs.map(
        (doc) => {
          const data = doc.data();
          const result = {
            id: doc.id,
            ...data,
          };
          
          // Convert startTime and endTime Firestore timestamps to Date objects
          if (data.startTime && typeof data.startTime.toDate === 'function') {
            result.startTime = data.startTime.toDate();
          }
          
          if (data.endTime && typeof data.endTime.toDate === 'function') {
            result.endTime = data.endTime.toDate();
          }
          
          return result;
        }
      ) as TestResult[];
      
      setTestResults(testData);
      
      // Fetch sleep entries
      let sleepQuery;
      if (timeRange === "all") {
        sleepQuery = query(
          collection(db, "sleepEntries"),
          orderBy("date", "desc")
        );
      } else {
        sleepQuery = query(
          collection(db, "sleepEntries"),
          where("date", ">=", firestoreStartDate),
          orderBy("date", "desc")
        );
      }
      
      const sleepSnapshot = await getDocs(sleepQuery);
      const sleepData = sleepSnapshot.docs.map(
        (doc) => {
          const data = doc.data();
          const entry = {
            id: doc.id,
            ...data,
          };
          
          // Convert date Firestore timestamp to Date object
          if (data.date && typeof data.date.toDate === 'function') {
            entry.date = data.date.toDate();
          }
          
          // Handle bedTime and wakeTime if they're timestamps
          if (data.bedTime && typeof data.bedTime.toDate === 'function') {
            entry.bedTime = data.bedTime.toDate().toISOString();
          }
          
          if (data.wakeTime && typeof data.wakeTime.toDate === 'function') {
            entry.wakeTime = data.wakeTime.toDate().toISOString();
          }
          
          // Handle createdAt if it exists
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            entry.createdAt = data.createdAt.toDate();
          }
          
          return entry;
        }
      ) as SleepEntry[];
      
      setSleepData(sleepData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (user && user.role !== "teacher") {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "teacher") return;
    fetchData();
  }, [user, fetchData]);

  const calculateAverages = () => {
    const averages = students.map((student) => {
      const studentTests = testResults.filter(
        (test) => test.userId === student.id
      );
      const studentSleep = sleepData.filter(
        (entry) => entry.userId === student.id
      );

      const avgScore = studentTests.length ? 
        studentTests.reduce((acc, test) => acc + (test.adjustedScore || test.score || 0), 0) / studentTests.length : 
        0;
      
      const avgSleep = studentSleep.length ? 
        studentSleep.reduce(
          (acc, entry) => {
            try {
              const bedTime = new Date(entry.bedTime).getTime();
              const wakeTime = new Date(entry.wakeTime).getTime();
              return acc + (wakeTime > bedTime ? (wakeTime - bedTime) / (1000 * 60 * 60) : 8);
            } catch (err) {
              console.warn("Error calculating sleep duration", err);
              return acc + (entry.sleepDuration || 0);
            }
          }, 0
        ) / studentSleep.length : 
        0;
      
      const avgQuality = studentSleep.length ? 
        studentSleep.reduce((acc, entry) => acc + (entry.sleepQuality || 0), 0) / studentSleep.length : 
        0;

      return {
        name: student.name,
        avgScore,
        avgSleep,
        avgQuality,
        userId: student.id,
        testsCount: studentTests.length,
        sleepEntriesCount: studentSleep.length
      };
    });

    return averages;
  };

  const getDifficultyStats = () => {
    const stats: DifficultyStats = {
      easy: { count: 0, avgScore: 0 },
      medium: { count: 0, avgScore: 0 },
      hard: { count: 0, avgScore: 0 },
      unknown: { count: 0, avgScore: 0 },
    };

    testResults.forEach((test) => {
      // Default to 'unknown' if difficulty is not defined
      const difficulty = (test.difficulty as Difficulty) || 'unknown';
      
      if (difficulty in stats) {
        stats[difficulty].count++;
        stats[difficulty].avgScore += test.adjustedScore || test.score || 0;
      } else {
        console.warn(`Test with invalid difficulty value: ${difficulty}`, test);
      }
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
            <CardDescription>Average score by test difficulty level</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart
              width={400}
              height={300}
              data={Object.entries(getDifficultyStats())
                .filter(([_, stats]) => stats.count > 0)
                .map(([diff, stats]) => ({
                  difficulty: diff === "unknown" ? "Not Specified" : diff.charAt(0).toUpperCase() + diff.slice(1),
                  avgScore: stats.avgScore,
                  count: stats.count,
                }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="difficulty" />
              <YAxis yAxisId="left" label={{ value: 'Avg Score', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Test Count', angle: 90, position: 'insideRight' }} />
              <Tooltip 
                formatter={(value, name) => [
                  Number(value).toFixed(1), 
                  name === "avgScore" ? "Average Score" : "Number of Tests"
                ]}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="avgScore" fill="#8884d8" name="Average Score" />
              <Bar yAxisId="right" dataKey="count" fill="#82ca9d" name="Number of Tests" />
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
              <XAxis 
                dataKey="avgQuality" 
                name="Sleep Quality" 
                domain={[0, 5]}
                label={{ value: 'Sleep Quality Rating (1-5)', position: 'bottom', offset: 10 }}
              />
              <YAxis 
                dataKey="avgScore" 
                name="Test Score"
                label={{ value: 'Test Score', angle: -90, position: 'insideLeft', offset: 0 }}
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                formatter={(value, name) => [
                  Number(value).toFixed(2), 
                  name === "avgQuality" ? "Sleep Quality" : name === "avgScore" ? "Test Score" : name
                ]}
                labelFormatter={(_, payload) => {
                  if (payload && payload.length > 0) {
                    return `${payload[0].payload.name} (${payload[0].payload.testsCount} tests, ${payload[0].payload.sleepEntriesCount} sleep entries)`;
                  }
                  return '';
                }}
              />
              <Scatter
                name="Students"
                data={calculateAverages()
                  .filter(student => student.avgQuality > 0 || student.avgScore > 0)}
                fill="#8884d8"
              />
            </ScatterChart>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Summary</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4">Student</th>
                  <th className="text-right py-2 px-4">Tests</th>
                  <th className="text-right py-2 px-4">Avg Score</th>
                  <th className="text-right py-2 px-4">Sleep Quality</th>
                </tr>
              </thead>
              <tbody>
                {calculateAverages()
                  .sort((a, b) => b.avgScore - a.avgScore)
                  .map((student) => (
                    <tr key={student.userId} className="border-b border-gray-200">
                      <td className="py-2 px-4">{student.name}</td>
                      <td className="text-right py-2 px-4">{student.testsCount}</td>
                      <td className="text-right py-2 px-4">{student.avgScore.toFixed(1)}</td>
                      <td className="text-right py-2 px-4">{student.avgQuality.toFixed(1)}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
