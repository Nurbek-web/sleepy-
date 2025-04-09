"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertBanner } from "@/components/AlertBanner";
import { useEffect, useState } from "react";
import { getTodayEntries } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [missingSleep, setMissingSleep] = useState(false);
  const [missingTest, setMissingTest] = useState(false);

  useEffect(() => {
    const checkTodayEntries = async () => {
      if (!user?.id) return;

      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      try {
        const { hasSleepEntry, hasTestEntry } = await getTodayEntries(
          user.id,
          startOfToday,
          endOfToday
        );

        setMissingSleep(!hasSleepEntry);
        setMissingTest(!hasTestEntry);
      } catch (error) {
        console.error("Failed to check today's entries:", error);
      }
    };

    checkTodayEntries();
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === "teacher") {
      router.push("/dashboard/teacher");
    }
  }, [user?.role, router]);

  if (user?.role === "teacher") {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>

      <AlertBanner missingSleep={missingSleep} missingTest={missingTest} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className={`p-6 ${
            missingSleep ? "border-red-500 dark:border-red-700 border-2" : ""
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Sleep Entry</h2>
            {!missingSleep && (
              <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm px-2 py-1 rounded">
                Completed
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {missingSleep
              ? "You haven't recorded your sleep data for today yet."
              : "You've already recorded your sleep data for today."}
          </p>
          <Button
            className={`w-full ${
              missingSleep ? "bg-red-500 hover:bg-red-600" : ""
            }`}
            onClick={() => router.push("/dashboard/sleep-entry")}
          >
            {missingSleep ? "Add Sleep Entry" : "Update Sleep Entry"}
          </Button>
        </Card>

        <Card
          className={`p-6 ${
            missingTest ? "border-red-500 dark:border-red-700 border-2" : ""
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Critical Thinking Test</h2>
            {!missingTest && (
              <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm px-2 py-1 rounded">
                Completed
              </div>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {missingTest
              ? "You haven't taken your critical thinking test for today."
              : "You've completed your critical thinking test for today."}
          </p>
          {missingTest ? (
            <Button
              className="w-full bg-red-500 hover:bg-red-600"
              onClick={() => router.push("/dashboard/test")}
            >
              Start Test
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push("/dashboard/test/history")}
              >
                View Results
              </Button>
              <Button
                className="w-full"
                onClick={() => router.push("/dashboard/test")}
              >
                Retake Test
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Sleep Stats</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View your sleep patterns and test performance.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/dashboard/sleep-dashboard")}
          >
            View Statistics
          </Button>
        </Card>
      </div>
    </div>
  );
}
