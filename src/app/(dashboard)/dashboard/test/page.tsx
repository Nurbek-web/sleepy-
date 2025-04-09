"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, memo } from "react";
import {
  collection,
  query,
  getDocs,
  addDoc,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { startOfDay, endOfDay } from "date-fns";
import { Slider } from "@/components/ui/slider";

interface Question {
  id?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const QUESTION_TIME_LIMIT = 120; // 2 minutes per question

// Define interface for the ReviewMode props
interface ReviewModeProps {
  questions: Question[];
  answers: string[];
  calculateScore: (answers: string[]) => number;
  alertnessRating: number;
  setAlertnessRating: (value: number) => void;
  handleSubmitTest: () => Promise<void>;
}

// Update the ReviewMode component with proper types
const ReviewMode = memo(({
  questions,
  answers,
  calculateScore,
  alertnessRating, 
  setAlertnessRating, 
  handleSubmitTest
}: ReviewModeProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Test Review</h2>
        <p className="text-gray-600">
          Score: {calculateScore(answers)} out of {questions.length}
        </p>
      </div>

      {questions.map((question: Question, index: number) => (
        <Card key={index} className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Question {index + 1}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  answers[index] === question.correctAnswer
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {answers[index] === question.correctAnswer
                  ? "Correct"
                  : "Incorrect"}
              </span>
            </div>

            <p>{question.question}</p>

            <div className="space-y-2">
              {question.options.map((option: string, optIndex: number) => (
                <div
                  key={optIndex}
                  className={`p-3 rounded ${
                    option === question.correctAnswer
                      ? "bg-green-100"
                      : option === answers[index]
                      ? "bg-red-100"
                      : "bg-gray-50"
                  }`}
                >
                  {option}
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-semibold mb-2">Explanation</h4>
              <p className="text-gray-700">{question.explanation}</p>
            </div>
          </div>
        </Card>
      ))}

      <div className="mt-8 space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">How alert do you feel right now?</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Very tired</span>
            <span className="text-sm text-gray-500">Very alert</span>
          </div>
          <Slider
            value={[alertnessRating]}
            max={10}
            step={1}
            onValueChange={(value: number[]) => setAlertnessRating(value[0])}
            className="w-full"
          />
          <div className="text-center">
            <p className="text-lg font-medium">{alertnessRating}/10</p>
          </div>
        </div>

        <Button 
          className="w-full" 
          size="lg" 
          onClick={handleSubmitTest}
        >
          Submit Test
        </Button>
      </div>
    </div>
  );
});

ReviewMode.displayName = "ReviewMode";

export default function TestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds
  const [answers, setAnswers] = useState<string[]>([]);
  const [startTime] = useState<Date>(new Date());
  const [alertnessRating, setAlertnessRating] = useState(5);

  // Move all hooks before any conditional returns
  const handleNextQuestion = useCallback(() => {
    setShowExplanation(false);
    setTimeRemaining(QUESTION_TIME_LIMIT);

    if (currentQuestionIndex === questions.length - 1) {
      setIsReviewMode(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const handleTimeUp = useCallback(() => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = ""; // No answer selected
    setAnswers(newAnswers);
    handleNextQuestion();
  }, [currentQuestionIndex, answers, handleNextQuestion]);

  const loadQuestions = useCallback(async () => {
    console.log("Starting loadQuestions function");
    setLoading(true);
    setError(null);
    try {
      console.log("Generating new questions...");
      const generatedQuestions: Question[] = [];

      for (let i = 0; i < 10; i++) {
        try {
          const response = await fetch("/api/generate-question", {
            method: "POST",
          });
          if (!response.ok) {
            throw new Error("Failed to generate question");
          }
          const questionData = await response.json();
          generatedQuestions.push(questionData);
        } catch (error) {
          console.error("Error generating question:", error);
        }
      }

      if (generatedQuestions.length === 0) {
        throw new Error("Failed to generate questions");
      }

      console.log(`Generated ${generatedQuestions.length} new questions`);
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setIsReviewMode(false);
      setShowExplanation(false);
      setTimeRemaining(QUESTION_TIME_LIMIT);
    } catch (error) {
      console.error("Error loading questions:", error);
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "teacher") {
      router.push("/dashboard/teacher");
    }
  }, [user?.role, router]);

  // Load questions when component mounts
  useEffect(() => {
    if (user) {
      console.log("User available, loading questions");
      loadQuestions();
    }
  }, [user, loadQuestions]);

  // Timer effect
  useEffect(() => {
    if (loading || isReviewMode || showExplanation) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return QUESTION_TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    loading,
    currentQuestionIndex,
    isReviewMode,
    showExplanation,
    handleTimeUp,
  ]);

  useEffect(() => {
    if (timeRemaining === 0) {
      handleTimeUp();
    }
  }, [timeRemaining, handleTimeUp]);

  const handleAnswerSelect = async (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const calculateScore = (answers: string[]) => {
    return answers.reduce((score, answer, index) => {
      return score + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
  };

  const handleSubmitTest = async () => {
    if (!user?.id) return;

    try {
      const finalScore = calculateScore(answers);
      const testResult = {
        userId: user.id,
        startTime,
        endTime: new Date(),
        score: finalScore,
        answers,
        questions: questions.map(
          ({ question, options, correctAnswer, explanation }) => ({
            question,
            options,
            correctAnswer,
            explanation,
          })
        ),
        alertnessRating,
      };

      // Get today's boundaries
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);

      // Query only by userId
      const testResultsQuery = query(
        collection(db, "testResults"),
        where("userId", "==", user.id)
      );

      const snapshot = await getDocs(testResultsQuery);

      // Find today's test result if it exists
      const todayResult = snapshot.docs.find((doc) => {
        const data = doc.data();
        const startTime = data.startTime?.toDate();
        return startTime >= startOfToday && startTime <= endOfToday;
      });

      if (todayResult) {
        // Update existing test result
        await updateDoc(todayResult.ref, testResult);
      } else {
        // Create new test result
        await addDoc(collection(db, "testResults"), testResult);
      }

      router.push("/dashboard/test/history");
    } catch (error) {
      console.error("Error submitting test:", error);
    }
  };

  if (user?.role === "teacher") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Test...</h2>
          <p className="text-gray-500">
            Please wait while we prepare your questions.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Error Loading Questions
          </h2>
          <p className="text-gray-500 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Question</h2>
          <p className="text-gray-500">
            There was an error loading the question. Please try again.
          </p>
          <Button onClick={loadQuestions} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isReviewMode) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <ReviewMode 
          questions={questions}
          answers={answers}
          calculateScore={calculateScore}
          alertnessRating={alertnessRating}
          setAlertnessRating={setAlertnessRating}
          handleSubmitTest={handleSubmitTest}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <div className="text-lg font-medium">
              Time: {Math.floor(timeRemaining / 60)}:
              {(timeRemaining % 60).toString().padStart(2, "0")}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-lg font-medium">
              {currentQuestion.question}
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    showExplanation
                      ? option === currentQuestion.correctAnswer
                        ? "default"
                        : answers[currentQuestionIndex] === option
                        ? "destructive"
                        : "outline"
                      : answers[currentQuestionIndex] === option
                      ? "default"
                      : "outline"
                  }
                  className="w-full justify-start text-left"
                  onClick={() => !showExplanation && handleAnswerSelect(option)}
                  disabled={showExplanation}
                >
                  {option}
                </Button>
              ))}
            </div>

            {showExplanation && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold mb-2">Explanation</h3>
                <p className="text-gray-700">{currentQuestion.explanation}</p>
                <Button className="mt-4" onClick={handleNextQuestion}>
                  {currentQuestionIndex < questions.length - 1
                    ? "Next Question"
                    : "Finish Test"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
