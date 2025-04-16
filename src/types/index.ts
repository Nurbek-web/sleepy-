export type UserRole = "student" | "teacher";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  grade?: string;
  createdAt: Date;
}

export interface SleepEntry {
  id: string;
  userId: string;
  date: Date;
  bedTime: string;
  wakeTime: string;
  sleepQuality: number; // 1-5 scale
  sleepDuration: number; // hours
  screenTime: number; // hours before bed
  caffeineIntake: number; // mg
  stressLevel: number; // 1-5 scale
  createdAt: Date;
}

export interface TestResult {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  score: number;
  version: string;
  alertnessRating: number; // 1-5
  questions: string[];
  answers: string[];
  difficulty: "easy" | "medium" | "hard" | undefined;
  baseScore: number; // Raw score before difficulty multiplier
  adjustedScore: number; // Score after difficulty multiplier
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  tags: string[];
}

export interface AnalyticsData {
  sleepDuration: number;
  sleepQuality: number;
  testScore: number;
  alertness: number;
  date: Date;
}
