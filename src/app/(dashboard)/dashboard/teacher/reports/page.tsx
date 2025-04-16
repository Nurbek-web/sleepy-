"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  limit,
  doc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Search, FileText, UserRound, Calendar, ArrowRight } from "lucide-react";
import { User, SleepEntry, TestResult } from "@/types";
import { executeQueryWithFallback, parseFirestoreDates } from '@/lib/firebase-utils';
import { getSleepEntries, getTestResults, getAllStudents } from "@/lib/db";

export default function StudentReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<{
    sleepEntries: SleepEntry[];
    testResults: TestResult[];
  } | null>(null);
  const [isLoadingSleepData, setIsLoadingSleepData] = useState(false);
  const [isLoadingTestData, setIsLoadingTestData] = useState(false);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    if (user?.role !== "teacher") {
      router.push("/dashboard");
      return;
    }

    const fetchStudents = async () => {
      setLoading(true);
      try {
        const studentsData = await getAllStudents();
        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students:", error);
        alert("Failed to load students. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [user, router]);

  const handleStudentSelect = async (student: User) => {
    setSelectedStudent(student);
    setLoading(true);

    try {
      // Fetch sleep entries using our utility function
      const sleepEntries = await getSleepEntries(student.id, 10);
      
      // Fetch test results using our utility function
      const testResults = await getTestResults(student.id, 10);

      setStudentData({
        sleepEntries,
        testResults
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
      alert("Failed to load student data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSleepQuality = (quality: number, id: string = 'default') => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={`star-${id}-${i}`} 
          className={`text-lg ${i <= quality ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      );
    }
    return <>{stars}</>;
  };

  const formatDate = (date: Date | string) => {
    try {
      return new Date(ensureDate(date)).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const ensureDate = (dateInput: string | Date): Date => {
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'string') return new Date(dateInput);
    return new Date(); // Fallback
  };

  const formatTimeValue = (timeValue: any): string => {
    if (!timeValue) return "N/A";
    
    // If it's a Date object, format it as a time string
    if (timeValue instanceof Date) {
      return timeValue.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    // If it's already a string, return it
    if (typeof timeValue === 'string') return timeValue;
    
    // Otherwise, convert to string
    return String(timeValue);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            if (selectedStudent) {
              setSelectedStudent(null);
              setStudentData(null);
            } else {
              router.push("/dashboard/teacher");
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {selectedStudent ? "Back to Students" : "Back"}
        </Button>
        <h1 className="text-3xl font-bold">
          {selectedStudent ? `${selectedStudent.name}'s Report` : "Student Reports"}
        </h1>
      </div>

      {!selectedStudent ? (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search students by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full text-center p-8">
                <p className="text-gray-500">No students found</p>
              </div>
            ) : (
              filteredStudents.map((student, index) => (
                <Card key={student.id || `student-${index}`} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UserRound className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">{student.name}</h3>
                          <p className="text-sm text-gray-500">{student.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => handleStudentSelect(student)}
                      >
                        View <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sleep Entries</CardTitle>
                  <span className="text-sm text-gray-500">
                    Last {studentData?.sleepEntries.length || 0} entries
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {studentData?.sleepEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No sleep entries recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentData?.sleepEntries.map((entry, index) => (
                      <div key={entry.id || `sleep-entry-${index}`} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{formatDate(entry.date)}</span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-sm text-gray-600">Sleep Duration:</span>
                              <span className="font-medium">{entry.sleepDuration.toFixed(1)} hrs</span>
                            </div>
                            <div className="mt-1">
                              <span className="text-sm text-gray-600">Quality:</span>{" "}
                              <span className="ml-2">{renderSleepQuality(entry.sleepQuality, `sleep-${entry.id || index}`)}</span>
                            </div>
                            <div className="mt-2 text-sm">
                              <div className="flex gap-4">
                                <div>
                                  <span className="text-gray-500">Bed Time:</span>{" "}
                                  <span>{formatTimeValue(entry.bedTime)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Wake Time:</span>{" "}
                                  <span>{formatTimeValue(entry.wakeTime)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Test Results</CardTitle>
                  <span className="text-sm text-gray-500">
                    Last {studentData?.testResults.length || 0} tests
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {studentData?.testResults.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No test results recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {studentData?.testResults.map((result, index) => (
                      <div key={result.id || `test-result-${index}`} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{formatDate(result.startTime)}</span>
                            </div>
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">Score:</span>{" "}
                              <span className="font-medium">{result.score}%</span>
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                                {result.difficulty}
                              </span>
                            </div>
                            <div className="mt-1">
                              <span className="text-sm text-gray-600">Alertness:</span>{" "}
                              <span className="ml-2">{renderSleepQuality(result.alertnessRating, `test-${result.id || index}`)}</span>
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Duration:</span>{" "}
                              <span>
                                {(() => {
                                  try {
                                    const startTime = ensureDate(result.startTime);
                                    const endTime = ensureDate(result.endTime);
                                    return Math.round((endTime.getTime() - startTime.getTime()) / 60000);
                                  } catch (error) {
                                    console.error("Error calculating duration:", error);
                                    return "N/A";
                                  }
                                })()} min
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h3 className="text-lg font-medium text-blue-800 mb-2">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-gray-500">Average Sleep Duration</h4>
                  <p className="text-2xl font-bold mt-1">
                    {studentData?.sleepEntries.length === 0
                      ? "N/A"
                      : `${((studentData?.sleepEntries.reduce((acc, entry) => acc + entry.sleepDuration, 0) || 0) / 
                          (studentData?.sleepEntries.length || 1)).toFixed(1)}`}{" "}
                    <span className="text-sm font-normal text-gray-500">hrs</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-gray-500">Average Sleep Quality</h4>
                  <p className="text-2xl font-bold mt-1">
                    {studentData?.sleepEntries.length === 0
                      ? "N/A"
                      : `${((studentData?.sleepEntries.reduce((acc, entry) => acc + entry.sleepQuality, 0) || 0) / 
                          (studentData?.sleepEntries.length || 1)).toFixed(1)}`}{" "}
                    <span className="text-sm font-normal text-gray-500">/ 5</span>
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-white">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium text-gray-500">Average Test Score</h4>
                  <p className="text-2xl font-bold mt-1">
                    {studentData?.testResults.length === 0
                      ? "N/A"
                      : `${((studentData?.testResults.reduce((acc, result) => acc + result.score, 0) || 0) / 
                          (studentData?.testResults.length || 1)).toFixed(1)}`}{" "}
                    <span className="text-sm font-normal text-gray-500">%</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 