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
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Plus, Edit, Trash2, Save } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
}

export default function TestManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestion, setNewQuestion] = useState<Omit<Question, "id">>({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    difficulty: "medium"
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (user?.role !== "teacher") {
      router.push("/dashboard");
      return;
    }

    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, "questions"));
        const querySnapshot = await getDocs(q);
        const fetchedQuestions: Question[] = [];
        
        querySnapshot.forEach((doc) => {
          fetchedQuestions.push({
            id: doc.id,
            ...doc.data()
          } as Question);
        });
        
        setQuestions(fetchedQuestions);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [user, router]);

  const handleAddQuestion = async () => {
    try {
      if (!newQuestion.question || 
          !newQuestion.correctAnswer || 
          newQuestion.options.some(opt => !opt) ||
          !newQuestion.difficulty) {
        alert("Please fill all fields");
        return;
      }

      // Create a valid question object with all required fields
      const questionData = {
        question: newQuestion.question,
        options: newQuestion.options,
        correctAnswer: newQuestion.correctAnswer,
        explanation: newQuestion.explanation || "No explanation provided",
        difficulty: newQuestion.difficulty
      };

      await addDoc(collection(db, "questions"), questionData);
      
      // Refresh the questions list
      const q = query(collection(db, "questions"));
      const querySnapshot = await getDocs(q);
      const fetchedQuestions: Question[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedQuestions.push({
          id: doc.id,
          ...doc.data()
        } as Question);
      });
      
      setQuestions(fetchedQuestions);
      setIsAddingNew(false);
      setNewQuestion({
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        explanation: "",
        difficulty: "medium"
      });
    } catch (error) {
      console.error("Error adding question:", error);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;
    
    try {
      // Validate required fields
      if (!editingQuestion.question || 
          !editingQuestion.correctAnswer || 
          editingQuestion.options.some(opt => !opt) ||
          !editingQuestion.difficulty) {
        alert("Please fill all required fields");
        return;
      }

      // Create a valid question object with all required fields
      const questionData = {
        question: editingQuestion.question,
        options: editingQuestion.options,
        correctAnswer: editingQuestion.correctAnswer,
        explanation: editingQuestion.explanation || "No explanation provided",
        difficulty: editingQuestion.difficulty
      };
      
      const questionRef = doc(db, "questions", editingQuestion.id);
      await updateDoc(questionRef, questionData);
      
      // Update the questions array
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? editingQuestion : q
      ));
      
      setEditingQuestion(null);
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    
    try {
      await deleteDoc(doc(db, "questions", id));
      setQuestions(questions.filter(q => q.id !== id));
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const fetchGeneratedQuestion = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate question');
      }
      
      const data = await response.json();
      
      // If we're adding a new question, set the form fields
      if (isAddingNew) {
        // Ensure we have all the required fields with defaults for any missing ones
        setNewQuestion({
          question: data.question || '',
          options: data.options || ['', '', '', ''],
          correctAnswer: data.correctAnswer || '',
          explanation: data.explanation || '',
          difficulty: 'medium' // Default difficulty
        });
      }
    } catch (error) {
      console.error('Error generating question:', error);
      alert('Failed to generate a question. Please try again or add one manually.');
    } finally {
      setLoading(false);
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push("/dashboard/teacher")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Test Management</h1>
        </div>
        
        <Button 
          onClick={() => setIsAddingNew(true)} 
          disabled={isAddingNew}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {isAddingNew && (
        <Card className="bg-white shadow-md animate-fade-in">
          <CardHeader>
            <CardTitle>New Question</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <Input
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                  placeholder="Enter question text"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">Options</label>
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion({...newQuestion, options: newOptions});
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Correct Answer</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={newQuestion.correctAnswer}
                  onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                >
                  <option value="" disabled>Select correct option</option>
                  {newQuestion.options.map((option, index) => (
                    <option key={index} value={option}>{option || `Option ${index + 1}`}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Explanation</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  value={newQuestion.explanation}
                  onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                  placeholder="Explanation for the correct answer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Difficulty</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md"
                  value={newQuestion.difficulty}
                  onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value as "easy" | "medium" | "hard"})}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button onClick={handleAddQuestion}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Question
                </Button>
                <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={fetchGeneratedQuestion}
                  disabled={loading}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  {loading ? 'Generating...' : 'Generate Question'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card className="p-6 text-center">
            <p>No questions available. Create your first question above.</p>
          </Card>
        ) : (
          questions.map((question) => (
            <Card key={question.id} className="p-6">
              {editingQuestion?.id === question.id ? (
                <div className="space-y-4">
                  <Input
                    value={editingQuestion.question}
                    onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                    className="font-medium text-lg"
                  />
                  
                  <div className="space-y-2">
                    {editingQuestion.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...editingQuestion.options];
                            newOptions[index] = e.target.value;
                            setEditingQuestion({...editingQuestion, options: newOptions});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Correct Answer</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md"
                      value={editingQuestion.correctAnswer}
                      onChange={(e) => setEditingQuestion({...editingQuestion, correctAnswer: e.target.value})}
                    >
                      {editingQuestion.options.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Explanation</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                      value={editingQuestion.explanation}
                      onChange={(e) => setEditingQuestion({...editingQuestion, explanation: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Difficulty</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md"
                      value={editingQuestion.difficulty}
                      onChange={(e) => setEditingQuestion(
                        {...editingQuestion, difficulty: e.target.value as "easy" | "medium" | "hard"}
                      )}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleUpdateQuestion}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingQuestion(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{question.question || "Untitled Question"}</h3>
                      <div className="mt-2 space-y-1">
                        {(question.options || []).map((option, index) => (
                          <div 
                            key={index} 
                            className={`px-3 py-1 rounded-md ${option === question.correctAnswer ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}`}
                          >
                            {option || `Option ${index + 1} (empty)`}
                            {option === question.correctAnswer && 
                              <span className="ml-2 text-green-600 text-xs font-medium">✓ Correct</span>
                            }
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 text-sm text-gray-600">
                        <p><span className="font-medium">Explanation:</span> {question.explanation || "No explanation provided"}</p>
                      </div>
                      
                      <div className="mt-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty ? 
                            question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) : 
                            'Unknown'
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingQuestion(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600" 
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 