"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (user?.role === "student") {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Teacher Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Student Analytics</h2>
          <p className="text-gray-600 mb-4">
            View aggregated sleep data and test performance.
          </p>
          <Button
            className="w-full"
            onClick={() => router.push("/dashboard/teacher/analytics")}
          >
            View Analytics
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Management</h2>
          <p className="text-gray-600 mb-4">
            Manage critical thinking test questions and versions.
          </p>
          <Button
            className="w-full"
            onClick={() => router.push("/dashboard/teacher/tests")}
          >
            Manage Tests
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Student Reports</h2>
          <p className="text-gray-600 mb-4">
            Generate and view individual student reports.
          </p>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/dashboard/teacher/reports")}
          >
            View Reports
          </Button>
        </Card>
      </div>
    </div>
  );
}
