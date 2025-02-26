"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateQuestion } from "@/lib/openai";
import { TestResult } from "@/types";

interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

const QUESTION_TIME_LIMIT = 120; // 2 minutes per question

export default function TestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [testStartTime, setTestStartTime] = useState<Date>();
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIME_LIMIT);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [alertnessRating, setAlertnessRating] = useState(5);

  // Add useEffect to load questions
  useEffect(() => {
    if (user) {
      loadQuestions();
    }
  }, [user, difficulty]);

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
  }, [loading, currentQuestionIndex, isReviewMode, showExplanation]);

  const handleTimeUp = useCallback(() => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = ""; // No answer selected
    setSelectedAnswers(newAnswers);
    handleNextQuestion();
  }, [currentQuestionIndex, selectedAnswers]);

  // Load questions with difficulty
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionPromises = Array(5)
        .fill(null)
        .map(() => generateQuestion(difficulty));
      const newQuestions = await Promise.all(questionPromises);
      setQuestions(newQuestions);
      setTestStartTime(new Date());
      setTimeRemaining(QUESTION_TIME_LIMIT);
      setLoading(false);
    } catch (err) {
      setError("Failed to load questions. Please try again.");
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setSelectedAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    setTimeRemaining(QUESTION_TIME_LIMIT);

    if (currentQuestionIndex === questions.length - 1) {
      setIsReviewMode(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const calculateScore = (answers: string[]) => {
    return answers.reduce((score, answer, index) => {
      return score + (answer === questions[index].correctAnswer ? 1 : 0);
    }, 0);
  };

  const submitTest = async () => {
    try {
      const score = calculateScore(selectedAnswers);
      const testResult: Omit<TestResult, "id"> = {
        userId: user!.id,
        startTime: testStartTime!,
        endTime: new Date(),
        score,
        version: "1.0",
        alertnessRating,
        questions: questions.map((q) => q.question),
        answers: selectedAnswers,
        difficulty,
        baseScore: score,
        adjustedScore:
          score *
          (difficulty === "easy" ? 1 : difficulty === "medium" ? 1.5 : 2),
      };

      await addDoc(collection(db, "testResults"), testResult);
      router.push("/dashboard/test/history");
    } catch (err) {
      setError("Failed to submit test. Please try again.");
    }
  };

  // Review mode component
  const ReviewMode = () => (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Test Review</h2>
        <p className="text-gray-600">
          Score: {calculateScore(selectedAnswers)} out of {questions.length}
        </p>
      </div>

      {questions.map((question, index) => (
        <Card key={index} className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Question {index + 1}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedAnswers[index] === question.correctAnswer
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedAnswers[index] === question.correctAnswer
                  ? "Correct"
                  : "Incorrect"}
              </span>
            </div>

            <p>{question.question}</p>

            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className={`p-3 rounded ${
                    option === question.correctAnswer
                      ? "bg-green-100"
                      : option === selectedAnswers[index]
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            How alert do you feel? (1-5)
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={alertnessRating}
            onChange={(e) => setAlertnessRating(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Very Tired</span>
            <span>Very Alert</span>
          </div>
        </div>

        <Button onClick={submitTest} className="w-full">
          Submit Test
        </Button>
      </div>
    </div>
  );

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

  if (isReviewMode) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <ReviewMode />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

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
                        : selectedAnswers[currentQuestionIndex] === option
                        ? "destructive"
                        : "outline"
                      : selectedAnswers[currentQuestionIndex] === option
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
