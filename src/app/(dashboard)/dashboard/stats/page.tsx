"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
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
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface StatsData {
  date: string;
  testScore: number;
  sleepDuration: number;
  sleepQuality: number;
  alertness: number;
  screenTime?: number;
  caffeineIntake?: number;
  stressLevel?: number;
  difficulty?: "easy" | "medium" | "hard" | "unknown";
}

interface CorrelationData {
  factor: string;
  correlation: number;
}

function getDateString(date: Date | { seconds: number; nanoseconds: number } | any) {
  try {
    if (!date) return "";
    
    // Handle Firestore Timestamp
    if (typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
    return new Date(date.seconds * 1000).toISOString().split("T")[0];
    }
    
    // Handle Firestore Timestamp with toDate method
    if (typeof date === 'object' && typeof date.toDate === 'function') {
      return date.toDate().toISOString().split("T")[0];
    }
    
    // Handle regular Date object or string
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split("T")[0];
  } catch (err) {
    console.error("Error parsing date:", err, date);
    return "";
  }
}

// Pearson correlation coefficient calculation
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

const CORRELATION_COLORS = {
  strong_positive: "#4caf50",
  moderate_positive: "#8bc34a",
  weak_positive: "#cddc39",
  neutral: "#9e9e9e",
  weak_negative: "#ffeb3b",
  moderate_negative: "#ff9800",
  strong_negative: "#f44336",
};

const getCorrelationColor = (correlation: number) => {
  const absCorr = Math.abs(correlation);
  if (absCorr > 0.7) {
    return correlation > 0 ? CORRELATION_COLORS.strong_positive : CORRELATION_COLORS.strong_negative;
  } else if (absCorr > 0.5) {
    return correlation > 0 ? CORRELATION_COLORS.moderate_positive : CORRELATION_COLORS.moderate_negative;
  } else if (absCorr > 0.3) {
    return correlation > 0 ? CORRELATION_COLORS.weak_positive : CORRELATION_COLORS.weak_negative;
  } else {
    return CORRELATION_COLORS.neutral;
  }
};

export default function StatsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statsData, setStatsData] = useState<StatsData[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [averages, setAverages] = useState({
    testScore: 0,
    sleepDuration: 0,
    sleepQuality: 0,
    alertness: 0,
    screenTime: 0,
    caffeineIntake: 0,
    stressLevel: 0,
  });
  const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("week");
  const [difficultyStats, setDifficultyStats] = useState<{
    easy: { count: number; avgScore: number };
    medium: { count: number; avgScore: number };
    hard: { count: number; avgScore: number };
    unknown: { count: number; avgScore: number };
  }>({
    easy: { count: 0, avgScore: 0 },
    medium: { count: 0, avgScore: 0 },
    hard: { count: 0, avgScore: 0 },
    unknown: { count: 0, avgScore: 0 },
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (timeRange === "week") startDate.setDate(now.getDate() - 7);
      if (timeRange === "month") startDate.setMonth(now.getMonth() - 1);

      let testQuery;
      let testResults: TestResult[] = [];
      let sleepEntries: SleepEntry[] = [];

      try {
        // Fetch test results with proper query
        if (timeRange === "all") {
          testQuery = query(
        collection(db, "testResults"),
        where("userId", "==", user!.id),
        orderBy("startTime", "desc")
      );
        } else {
          // Create a proper Timestamp object for Firestore
          const firestoreStartDate = Timestamp.fromDate(startDate);
          
          testQuery = query(
            collection(db, "testResults"),
            where("userId", "==", user!.id),
            where("startTime", ">=", firestoreStartDate),
            orderBy("startTime", "desc")
          );
        }
        
      const testSnapshot = await getDocs(testQuery);
        console.log(`Found ${testSnapshot.docs.length} test results`);
        
        testResults = testSnapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            
            // Convert timestamps to Date objects
            const parsedData: any = {
          id: doc.id,
              ...data,
            };
            
            // Convert startTime and endTime if they exist and are Firestore timestamps
            if (data.startTime && typeof data.startTime.toDate === 'function') {
              parsedData.startTime = data.startTime.toDate();
            }
            
            if (data.endTime && typeof data.endTime.toDate === 'function') {
              parsedData.endTime = data.endTime.toDate();
            }
            
            return parsedData;
          }
      ) as TestResult[];
      } catch (err) {
        console.error("Error fetching test results:", err);
      }

      try {
        // Fetch sleep entries with proper query
        let sleepQuery;
        if (timeRange === "all") {
          sleepQuery = query(
        collection(db, "sleepEntries"),
        where("userId", "==", user!.id),
        orderBy("date", "desc")
      );
        } else {
          // Create a proper Timestamp object for Firestore
          const firestoreStartDate = Timestamp.fromDate(startDate);
          
          sleepQuery = query(
            collection(db, "sleepEntries"),
            where("userId", "==", user!.id),
            where("date", ">=", firestoreStartDate),
            orderBy("date", "desc")
          );
        }
        
      const sleepSnapshot = await getDocs(sleepQuery);
        console.log(`Found ${sleepSnapshot.docs.length} sleep entries`);
        
        sleepEntries = sleepSnapshot.docs.map(
          (doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            
            // Convert timestamps to Date objects
            const parsedData: any = {
          id: doc.id,
              ...data,
            };
            
            // Convert date if it exists and is a Firestore timestamp
            if (data.date && typeof data.date.toDate === 'function') {
              parsedData.date = data.date.toDate();
            }
            
            // Convert createdAt if it exists and is a Firestore timestamp
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
              parsedData.createdAt = data.createdAt.toDate();
            }
            
            return parsedData;
          }
      ) as SleepEntry[];
      } catch (err) {
        console.error("Error fetching sleep entries:", err);
      }

      // Process and combine data
      const dateMap = new Map<string, StatsData>();

      console.log("Processing test results:", testResults.length);
      console.log("Processing sleep entries:", sleepEntries.length);

      // Process test results
      testResults.forEach((test) => {
        try {
          // Ensure startTime exists
          if (!test.startTime) {
            console.warn("Test result missing startTime:", test);
            return;
          }
          
          const date = getDateString(test.startTime);
          if (!date) {
            console.warn("Could not parse date from test startTime:", test.startTime);
            return;
          }
          
          console.log(`Test on ${date}: score=${test.score}, difficulty=${test.difficulty}`);
          if (!dateMap.has(date)) {
            dateMap.set(date, {
              date,
              testScore: test.score || 0,
              sleepDuration: 0,
              sleepQuality: 0,
              alertness: test.alertnessRating || 0,
              screenTime: 0,
              caffeineIntake: 0,
              stressLevel: 0,
              difficulty: test.difficulty || "unknown",
            });
          } else {
            // If we already have an entry for this date, update the test score
            const existing = dateMap.get(date)!;
            existing.testScore = test.score || 0;
            existing.alertness = test.alertnessRating || 0;
            existing.difficulty = test.difficulty || "unknown";
          }
        } catch (err) {
          console.error("Error processing test result:", err, test);
        }
      });

      // Process sleep entries
      sleepEntries.forEach((sleep) => {
        try {
          // Ensure date exists
          if (!sleep.date) {
            console.warn("Sleep entry missing date:", sleep);
            return;
          }
          
          const date = getDateString(sleep.date);
          if (!date) {
            console.warn("Could not parse date from sleep date:", sleep.date);
            return;
          }
          
          console.log(`Sleep on ${date}: duration=${sleep.sleepDuration}, quality=${sleep.sleepQuality}`);
          const existing = dateMap.get(date) || {
            date,
            testScore: 0,
            sleepDuration: 0,
            sleepQuality: 0,
            alertness: 0,
            screenTime: 0,
            caffeineIntake: 0,
            stressLevel: 0,
          };

          existing.sleepDuration = sleep.sleepDuration || 0;
          existing.sleepQuality = sleep.sleepQuality || 0;
          existing.screenTime = sleep.screenTime || 0;
          existing.caffeineIntake = sleep.caffeineIntake || 0;
          existing.stressLevel = sleep.stressLevel || 0;
          dateMap.set(date, existing);
        } catch (err) {
          console.error("Error processing sleep entry:", err, sleep);
        }
      });

      // Convert map to array and sort by date
      const sortedData = Array.from(dateMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      
      console.log(`Final processed data: ${sortedData.length} entries`);

      // Calculate averages
      const avgData = sortedData.reduce(
        (acc, curr) => ({
          testScore: acc.testScore + curr.testScore,
          sleepDuration: acc.sleepDuration + curr.sleepDuration,
          sleepQuality: acc.sleepQuality + curr.sleepQuality,
          alertness: acc.alertness + curr.alertness,
          screenTime: acc.screenTime + (curr.screenTime || 0),
          caffeineIntake: acc.caffeineIntake + (curr.caffeineIntake || 0),
          stressLevel: acc.stressLevel + (curr.stressLevel || 0),
        }),
        { 
          testScore: 0, 
          sleepDuration: 0, 
          sleepQuality: 0, 
          alertness: 0,
          screenTime: 0,
          caffeineIntake: 0,
          stressLevel: 0
        }
      );

      const dataLength = sortedData.length || 1;
      setAverages({
        testScore: avgData.testScore / dataLength,
        sleepDuration: avgData.sleepDuration / dataLength,
        sleepQuality: avgData.sleepQuality / dataLength,
        alertness: avgData.alertness / dataLength,
        screenTime: avgData.screenTime / dataLength,
        caffeineIntake: avgData.caffeineIntake / dataLength,
        stressLevel: avgData.stressLevel / dataLength,
      });

      // Calculate correlations with test score
      if (sortedData.length > 1) {
        const factorNames = [
          "sleepDuration", 
          "sleepQuality", 
          "alertness", 
          "screenTime", 
          "caffeineIntake", 
          "stressLevel"
        ];
        
        const correlationsData = factorNames.map(factor => {
          const validPairs = sortedData.filter(d => d.testScore && d[factor as keyof StatsData]);
          const x = validPairs.map(d => Number(d[factor as keyof StatsData]));
          const y = validPairs.map(d => d.testScore);
          
          return {
            factor,
            correlation: calculateCorrelation(x, y)
          };
        }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
        
        setCorrelations(correlationsData);
      }

      // Calculate difficulty stats
      const diffStats = {
        easy: { count: 0, avgScore: 0 },
        medium: { count: 0, avgScore: 0 },
        hard: { count: 0, avgScore: 0 },
        unknown: { count: 0, avgScore: 0 },
      };

      testResults.forEach((test) => {
        const difficulty = test.difficulty || "unknown";
        if (difficulty in diffStats) {
          diffStats[difficulty as keyof typeof diffStats].count++;
          diffStats[difficulty as keyof typeof diffStats].avgScore += test.score || 0;
        }
      });

      // Calculate averages for each difficulty
      Object.keys(diffStats).forEach((diff) => {
        const key = diff as keyof typeof diffStats;
        if (diffStats[key].count > 0) {
          diffStats[key].avgScore /= diffStats[key].count;
        }
      });

      setDifficultyStats(diffStats);

      setStatsData(sortedData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load statistics");
      setLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData, timeRange]);

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sleep & Performance Analytics</h1>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 rounded ${timeRange === 'week' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`} 
            onClick={() => setTimeRange('week')}
          >
            Last Week
          </button>
          <button 
            className={`px-3 py-1 rounded ${timeRange === 'month' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`} 
            onClick={() => setTimeRange('month')}
          >
            Last Month
          </button>
          <button 
            className={`px-3 py-1 rounded ${timeRange === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`} 
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
          <button 
            className="px-3 py-1 rounded bg-destructive text-destructive-foreground"
            onClick={() => {
              // Generate patterned data for research conclusions
              const mockData: StatsData[] = [];
              const now = new Date();
              
              // Create 30 days of data with clear sleep-performance patterns
              for (let i = 0; i < 30; i++) {
                const date = new Date();
                date.setDate(now.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                // Create a cyclical sleep pattern (good sleep for a few days, then poor sleep)
                // This will demonstrate how sleep affects performance
                const cyclePosition = i % 10; // 10-day cycle
                
                let sleepHours, sleepQuality, testScore, alertness, screenTime, caffeineIntake, stressLevel;
                let difficulty: "easy" | "medium" | "hard";
                
                // Days 0-4: Good sleep pattern
                if (cyclePosition < 5) {
                  sleepHours = 7.5 + (Math.random() * 1); // 7.5-8.5 hours
                  sleepQuality = 4 + (Math.random() < 0.7 ? 1 : 0); // Mostly 5, some 4
                  screenTime = 0.5 + (Math.random() * 1); // 0.5-1.5 hours
                  caffeineIntake = 50 + (Math.random() * 50); // 50-100mg
                  stressLevel = 1 + (Math.random() < 0.7 ? 0 : 1); // Mostly 1, some 2
                  
                  // Good sleep = good alertness (with small variations)
                  alertness = 4 + (Math.random() < 0.7 ? 1 : 0); // Mostly 5, some 4
                  
                  // Pattern: performance is better after good sleep
                  testScore = 85 + (Math.random() * 15); // 85-100
                }
                // Days 5-7: Transition to poor sleep
                else if (cyclePosition < 8) {
                  sleepHours = 6 + (Math.random() * 1); // 6-7 hours
                  sleepQuality = 3 + (Math.random() < 0.5 ? 0 : 1); // Mix of 3 and 4
                  screenTime = 1.5 + (Math.random() * 1); // 1.5-2.5 hours
                  caffeineIntake = 150 + (Math.random() * 50); // 150-200mg
                  stressLevel = 2 + (Math.random() < 0.5 ? 1 : 0); // Mix of 2 and 3
                  
                  // Medium sleep = medium alertness
                  alertness = 3 + (Math.random() < 0.5 ? 0 : 1); // Mix of 3 and 4
                  
                  // Pattern: performance starts to decline
                  testScore = 70 + (Math.random() * 15); // 70-85
                }
                // Days 8-9: Poor sleep pattern
                else {
                  sleepHours = 4 + (Math.random() * 1.5); // 4-5.5 hours
                  sleepQuality = 1 + (Math.random() < 0.3 ? 1 : 0); // Mostly 1, some 2
                  screenTime = 3 + (Math.random() * 1); // 3-4 hours
                  caffeineIntake = 250 + (Math.random() * 150); // 250-400mg
                  stressLevel = 4 + (Math.random() < 0.7 ? 1 : 0); // Mostly 5, some 4
                  
                  // Poor sleep = poor alertness
                  alertness = 1 + (Math.random() < 0.3 ? 1 : 0); // Mostly 1, some 2
                  
                  // Pattern: performance is significantly worse after poor sleep
                  testScore = 40 + (Math.random() * 25); // 40-65
                }
                
                // Vary test difficulty throughout the month
                // Easy tests early in the week, harder tests later
                const dayOfWeek = (date.getDay() + 1) % 7; // 0-6, shifted to make Sunday=0
                if (dayOfWeek < 2) {
                  difficulty = "easy";
                  // Easy tests have slightly higher scores
                  testScore = Math.min(100, testScore * 1.1);
                } else if (dayOfWeek < 5) {
                  difficulty = "medium";
                  // Medium tests have normal scores
                } else {
                  difficulty = "hard";
                  // Hard tests have slightly lower scores
                  testScore = testScore * 0.9;
                }
                
                // Ensure test score is within bounds
                testScore = Math.min(100, Math.max(0, Math.round(testScore)));
                
                // Add slight randomization to make data look natural
                sleepHours = Math.round(sleepHours * 10) / 10; // Round to 1 decimal place
                sleepQuality = Math.min(5, Math.max(1, Math.round(sleepQuality)));
                alertness = Math.min(5, Math.max(1, Math.round(alertness)));
                screenTime = Math.round(screenTime * 10) / 10;
                caffeineIntake = Math.round(caffeineIntake);
                stressLevel = Math.min(5, Math.max(1, Math.round(stressLevel)));
                
                mockData.push({
                  date: dateStr,
                  testScore,
                  sleepDuration: sleepHours,
                  sleepQuality,
                  alertness,
                  screenTime,
                  caffeineIntake,
                  stressLevel,
                  difficulty,
                });
              }
              
              // Calculate averages
              const avgData = mockData.reduce(
                (acc, curr) => ({
                  testScore: acc.testScore + curr.testScore,
                  sleepDuration: acc.sleepDuration + curr.sleepDuration,
                  sleepQuality: acc.sleepQuality + curr.sleepQuality,
                  alertness: acc.alertness + curr.alertness,
                  screenTime: acc.screenTime + (curr.screenTime || 0),
                  caffeineIntake: acc.caffeineIntake + (curr.caffeineIntake || 0),
                  stressLevel: acc.stressLevel + (curr.stressLevel || 0),
                }),
                { 
                  testScore: 0, 
                  sleepDuration: 0, 
                  sleepQuality: 0, 
                  alertness: 0,
                  screenTime: 0,
                  caffeineIntake: 0,
                  stressLevel: 0
                }
              );
              
              const dataLength = mockData.length;
              setAverages({
                testScore: avgData.testScore / dataLength,
                sleepDuration: avgData.sleepDuration / dataLength,
                sleepQuality: avgData.sleepQuality / dataLength,
                alertness: avgData.alertness / dataLength,
                screenTime: avgData.screenTime / dataLength,
                caffeineIntake: avgData.caffeineIntake / dataLength,
                stressLevel: avgData.stressLevel / dataLength,
              });
              
              // Calculate correlations with proper patterns
              const factorNames = [
                "sleepDuration", 
                "sleepQuality", 
                "alertness", 
                "screenTime", 
                "caffeineIntake", 
                "stressLevel"
              ];
              
              // Calculate actual correlations from the patterned data
              const calculatedCorrelations = factorNames.map(factor => {
                const validPairs = mockData.filter(d => d.testScore && d[factor as keyof StatsData]);
                const x = validPairs.map(d => Number(d[factor as keyof StatsData]));
                const y = validPairs.map(d => d.testScore);
                
                return {
                  factor,
                  correlation: calculateCorrelation(x, y)
                };
              }).sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
              
              // Calculate difficulty stats from the patterned data
              const calculatedDiffStats = {
                easy: { count: 0, avgScore: 0 },
                medium: { count: 0, avgScore: 0 },
                hard: { count: 0, avgScore: 0 },
                unknown: { count: 0, avgScore: 0 },
              };
              
              mockData.forEach(test => {
                const difficulty = test.difficulty || "unknown";
                if (difficulty in calculatedDiffStats) {
                  calculatedDiffStats[difficulty as keyof typeof calculatedDiffStats].count++;
                  calculatedDiffStats[difficulty as keyof typeof calculatedDiffStats].avgScore += test.testScore;
                }
              });
              
              // Calculate averages for each difficulty
              Object.keys(calculatedDiffStats).forEach(diff => {
                const key = diff as keyof typeof calculatedDiffStats;
                if (calculatedDiffStats[key].count > 0) {
                  calculatedDiffStats[key].avgScore /= calculatedDiffStats[key].count;
                }
              });
              
              // Update state with patterned data
              setStatsData(mockData);
              setCorrelations(calculatedCorrelations);
              setDifficultyStats(calculatedDiffStats);
              
              alert("Research-patterned data generated! You can now see meaningful relationships between sleep and performance.");
            }}
          >
            Generate Patterned Data
          </button>
        </div>
      </div>

      {statsData.length === 0 ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No data available</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>There is no data available for the selected time period. To see meaningful analytics:</p>
            <ul className="list-disc pl-5">
              <li>Try a different time range (Last Week, Last Month, or All Time)</li>
              <li>Log your sleep data daily using the Sleep Entry form</li>
              <li>Complete cognitive tests regularly to track your performance</li>
            </ul>
            <p>The more data you add, the more meaningful insights you'll get!</p>
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
              <CardHeader className="pb-2">
            <CardTitle>Average Test Score</CardTitle>
                <CardDescription>Performance measure</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {averages.testScore.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
              <CardHeader className="pb-2">
                <CardTitle>Sleep Duration</CardTitle>
                <CardDescription>Average hours per night</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {averages.sleepDuration.toFixed(1)}h
            </p>
          </CardContent>
        </Card>

        <Card>
              <CardHeader className="pb-2">
                <CardTitle>Sleep Quality</CardTitle>
                <CardDescription>Self-reported (1-5 scale)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {averages.sleepQuality.toFixed(1)}/5
            </p>
          </CardContent>
        </Card>

        <Card>
              <CardHeader className="pb-2">
                <CardTitle>Alertness</CardTitle>
                <CardDescription>Pre-test rating (1-5 scale)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {averages.alertness.toFixed(1)}/5
            </p>
          </CardContent>
        </Card>
      </div>

          <Tabs defaultValue="trends">
            <TabsList className="mb-4">
              <TabsTrigger value="trends">Trends Over Time</TabsTrigger>
              <TabsTrigger value="correlations">Factor Analysis</TabsTrigger>
              <TabsTrigger value="sleep">Sleep Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="trends" className="space-y-6">
              {/* Test Scores and Sleep Duration Chart */}
        <Card>
          <CardHeader>
                  <CardTitle>Test Performance and Sleep Duration</CardTitle>
                  <CardDescription>Track how your test scores correlate with sleep duration over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 12}}
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                      />
                      <YAxis 
                        yAxisId="left" 
                        domain={[0, Math.max(...statsData.map(d => d.testScore)) * 1.1 || 100]}
                        label={{ value: 'Test Score', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        domain={[0, Math.max(...statsData.map(d => d.sleepDuration)) * 1.1 || 12]}
                        label={{ value: 'Sleep Hours', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          Number(value).toFixed(1), 
                          name === "testScore" ? "Test Score" : "Sleep Hours"
                        ]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="testScore"
                  stroke="#8884d8"
                  name="Test Score"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                        dataKey="sleepDuration"
                        stroke="#4caf50"
                        name="Sleep Hours"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

              {/* Sleep Quality and Alertness Chart */}
        <Card>
          <CardHeader>
                  <CardTitle>Sleep Quality and Alertness Over Time</CardTitle>
                  <CardDescription>Track how your perceived sleep quality affects alertness</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{fontSize: 12}}
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                      />
                      <YAxis domain={[0, 5.5]} label={{ value: 'Rating (1-5)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name) => [
                          Number(value).toFixed(1), 
                          name === "sleepQuality" ? "Sleep Quality" : "Alertness"
                        ]}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      />
                <Legend />
                <Line
                  type="monotone"
                        dataKey="sleepQuality"
                        stroke="#ff7043"
                        name="Sleep Quality"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                        dataKey="alertness"
                        stroke="#42a5f5"
                        name="Alertness"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="correlations" className="space-y-6">
              {/* Correlation Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>Factors Affecting Test Performance</CardTitle>
                  <CardDescription>Pearson correlation coefficient between factors and test scores</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={correlations}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        domain={[-1, 1]} 
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <YAxis 
                        dataKey="factor" 
                        type="category" 
                        width={100}
                        tickFormatter={(value) => {
                          switch (value) {
                            case 'sleepDuration': return 'Sleep Duration';
                            case 'sleepQuality': return 'Sleep Quality';
                            case 'alertness': return 'Alertness';
                            case 'screenTime': return 'Screen Time';
                            case 'caffeineIntake': return 'Caffeine Intake';
                            case 'stressLevel': return 'Stress Level';
                            default: return value;
                          }
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [
                          Number(value).toFixed(2), 
                          "Correlation with Test Score"
                        ]}
                        labelFormatter={(label) => {
                          switch (label) {
                            case 'sleepDuration': return 'Sleep Duration';
                            case 'sleepQuality': return 'Sleep Quality';
                            case 'alertness': return 'Alertness';
                            case 'screenTime': return 'Screen Time';
                            case 'caffeineIntake': return 'Caffeine Intake';
                            case 'stressLevel': return 'Stress Level';
                            default: return label;
                          }
                        }}
                      />
                      <Legend />
                      <Bar dataKey="correlation" name="Correlation Coefficient">
                        {correlations.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCorrelationColor(entry.correlation)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Scatter Plot */}
              <Card>
                <CardHeader>
                  <CardTitle>Sleep Quality vs. Test Performance</CardTitle>
                  <CardDescription>Relationship between sleep quality and test scores</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="sleepQuality" 
                        name="Sleep Quality" 
                        domain={[0, 5.5]} 
                        label={{ value: 'Sleep Quality (1-5)', position: 'bottom', offset: 0 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="testScore" 
                        name="Test Score" 
                        label={{ value: 'Test Score', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => [Number(value).toFixed(1), name]}
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return `Date: ${new Date(payload[0].payload.date).toLocaleDateString()}`;
                          }
                          return '';
                        }}
                      />
                      <Scatter 
                        name="Sleep vs Performance" 
                        data={statsData.filter(d => 
                          d.sleepQuality > 0 && 
                          d.testScore > 0
                        )} 
                        fill="#8884d8"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Test Performance by Difficulty */}
              <Card>
                <CardHeader>
                  <CardTitle>Test Performance by Difficulty</CardTitle>
                  <CardDescription>Compare your test scores across different difficulty levels</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(difficultyStats)
                        .filter(([diff, stats]) => stats.count > 0)
                        .map(([diff, stats]) => ({
                          difficulty: diff === "unknown" ? "Not Specified" : diff.charAt(0).toUpperCase() + diff.slice(1),
                          avgScore: stats.avgScore,
                          count: stats.count,
                        }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="difficulty" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: 'Average Score', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Number of Tests', angle: 90, position: 'insideRight' }} />
                      <Tooltip formatter={(value, name) => [
                        Number(value).toFixed(1),
                        name === "avgScore" ? "Average Score" : "Number of Tests"
                      ]} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="avgScore" fill="#8884d8" name="Average Score" />
                      <Bar yAxisId="right" dataKey="count" fill="#82ca9d" name="Number of Tests" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="sleep" className="space-y-6">
              {/* Additional Sleep Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Avg. Screen Time</CardTitle>
                    <CardDescription>Hours before bed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {averages.screenTime.toFixed(1)}h
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Avg. Caffeine Intake</CardTitle>
                    <CardDescription>Milligrams (mg)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {averages.caffeineIntake.toFixed(0)} mg
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Avg. Stress Level</CardTitle>
                    <CardDescription>Scale of 1-5</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      {averages.stressLevel.toFixed(1)}/5
                    </p>
          </CardContent>
        </Card>
      </div>
              
              {/* Sleep Factor Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Sleep Quality Distribution</CardTitle>
                  <CardDescription>Distribution of sleep quality ratings</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={
                          [1, 2, 3, 4, 5].map(rating => ({
                            rating,
                            value: statsData.filter(d => Math.round(d.sleepQuality) === rating).length
                          }))
                        }
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ rating, value, percent }) => `${rating}/5: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="rating"
                      >
                        {
                          [1, 2, 3, 4, 5].map((rating, index) => (
                            <Cell key={`cell-${index}`} fill={[
                              "#f44336", "#ff9800", "#ffeb3b", "#8bc34a", "#4caf50"
                            ][index]} />
                          ))
                        }
                      </Pie>
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} entries`, 
                          `Sleep Quality Rating: ${props.payload.rating}/5`
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Screen Time Impact */}
              <Card>
                <CardHeader>
                  <CardTitle>Screen Time vs. Sleep Duration</CardTitle>
                  <CardDescription>How screen usage before bed affects sleep duration</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="screenTime" 
                        name="Screen Time" 
                        label={{ value: 'Screen Time Before Bed (hours)', position: 'bottom', offset: 0 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="sleepDuration" 
                        name="Sleep Duration" 
                        label={{ value: 'Sleep Duration (hours)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value, name) => [Number(value).toFixed(1), name === "screenTime" ? "Screen Time (hours)" : "Sleep Duration (hours)"]}
                        labelFormatter={(_, payload) => {
                          if (payload && payload.length > 0) {
                            return `Date: ${new Date(payload[0].payload.date).toLocaleDateString()}`;
                          }
                          return '';
                        }}
                      />
                      <Scatter 
                        name="Screen Time Impact" 
                        data={statsData.filter(d => d.screenTime !== undefined && d.sleepDuration)} 
                        fill="#ff7043"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
