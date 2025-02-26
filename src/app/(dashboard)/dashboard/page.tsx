"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role === "teacher") {
    router.push("/dashboard/teacher");
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Student Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sleep Entry</h2>
          <p className="text-gray-600 mb-4">
            Record your daily sleep data and habits.
          </p>
          <Button
            className="w-full"
            onClick={() => router.push("/dashboard/sleep-entry")}
          >
            Add Sleep Entry
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Critical Thinking Test</h2>
          <p className="text-gray-600 mb-4">
            Take a critical thinking assessment.
          </p>
          <Button
            className="w-full"
            onClick={() => router.push("/dashboard/test")}
          >
            Start Test
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Sleep Stats</h2>
          <p className="text-gray-600 mb-4">
            View your sleep patterns and test performance.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/dashboard/stats")}
          >
            View Statistics
          </Button>
        </Card>
      </div>
    </div>
  );
}
