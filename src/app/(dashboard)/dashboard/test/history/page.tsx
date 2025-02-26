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
  doc,
  getDoc,
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
} from "recharts";

export default function TestHistoryPage() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [sleepData, setSleepData] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch test results
        const testQuery = query(
          collection(db, "testResults"),
          where("userId", "==", user.id),
          orderBy("startTime", "desc")
        );
        const testSnapshot = await getDocs(testQuery);
        const testData = testSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TestResult[];

        // Fetch sleep entries
        const sleepQuery = query(
          collection(db, "sleepEntries"),
          where("userId", "==", user.id),
          orderBy("date", "desc")
        );
        const sleepSnapshot = await getDocs(sleepQuery);
        const sleepData = sleepSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SleepEntry[];

        setTestResults(testData);
        setSleepData(sleepData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const calculateSleepDuration = (entry: SleepEntry) => {
    const bedTime = new Date(entry.bedTime);
    const wakeTime = new Date(entry.wakeTime);
    const duration =
      (wakeTime.getTime() - bedTime.getTime()) / (1000 * 60 * 60);
    return duration;
  };

  const chartData = testResults.map((test) => {
    const testDate = new Date(test.startTime);
    const sleepEntry = sleepData.find(
      (entry) => new Date(entry.date).toDateString() === testDate.toDateString()
    );

    return {
      date: testDate.toLocaleDateString(),
      score: test.score,
      alertness: test.alertnessRating,
      sleepDuration: sleepEntry ? calculateSleepDuration(sleepEntry) : null,
      sleepQuality: sleepEntry?.sleepQuality || null,
    };
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Test History</h1>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            <LineChart
              width={800}
              height={400}
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="score"
                stroke="#8884d8"
                name="Test Score"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sleepDuration"
                stroke="#82ca9d"
                name="Sleep Duration (hours)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="alertness"
                stroke="#ffc658"
                name="Alertness Rating"
              />
            </LineChart>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {testResults.map((test) => (
          <Card key={test.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Test on {new Date(test.startTime).toLocaleDateString()}
                  </h3>
                  <p className="text-gray-500">
                    Score: {test.score} / {test.questions.length}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Duration:{" "}
                    {Math.round(
                      (new Date(test.endTime).getTime() -
                        new Date(test.startTime).getTime()) /
                        (1000 * 60)
                    )}{" "}
                    minutes
                  </p>
                  <p className="text-sm text-gray-500">
                    Alertness: {test.alertnessRating}/5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
