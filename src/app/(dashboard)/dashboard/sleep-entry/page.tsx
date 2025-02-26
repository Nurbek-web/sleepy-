"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SleepEntry } from "@/types";

export default function SleepEntryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    bedTime: "22:00",
    wakeTime: "07:00",
    sleepQuality: 3,
    screenTime: 2,
    caffeineIntake: 0,
    stressLevel: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate times
      const bedDateTime = new Date(`${formData.date}T${formData.bedTime}`);
      const wakeDateTime = new Date(`${formData.date}T${formData.wakeTime}`);

      // If wake time is before bed time, assume it's the next day
      if (wakeDateTime < bedDateTime) {
        wakeDateTime.setDate(wakeDateTime.getDate() + 1);
      }

      const sleepEntry: Omit<SleepEntry, "id"> = {
        userId: user!.id,
        date: new Date(formData.date),
        bedTime: bedDateTime,
        wakeTime: wakeDateTime,
        sleepQuality: Number(formData.sleepQuality),
        screenTime: Number(formData.screenTime),
        caffeineIntake: Number(formData.caffeineIntake),
        stressLevel: Number(formData.stressLevel),
        createdAt: new Date(),
      };

      await addDoc(collection(db, "sleepEntries"), sleepEntry);
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to save sleep entry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New Sleep Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bed Time
                  </label>
                  <Input
                    type="time"
                    value={formData.bedTime}
                    onChange={(e) =>
                      setFormData({ ...formData, bedTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Wake Time
                  </label>
                  <Input
                    type="time"
                    value={formData.wakeTime}
                    onChange={(e) =>
                      setFormData({ ...formData, wakeTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Sleep Quality (1-5)
                </label>
                <Input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.sleepQuality}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sleepQuality: Number(e.target.value),
                    })
                  }
                  className="w-full"
                  required
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Poor</span>
                  <span>Excellent</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Screen Time (hours before bed)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={formData.screenTime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      screenTime: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Caffeine Intake (mg)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="10"
                  value={formData.caffeineIntake}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caffeineIntake: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Stress Level (1-5)
                </label>
                <Input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.stressLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stressLevel: Number(e.target.value),
                    })
                  }
                  className="w-full"
                  required
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
