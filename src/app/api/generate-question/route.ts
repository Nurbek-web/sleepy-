import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST() {
  console.log("API route called - generating question");
  try {
    const prompt = `Generate a critical thinking question with 4 multiple choice options. Return ONLY valid JSON with no backticks or additional formatting, following this exact structure:
{
  "question": "question text",
  "options": ["option1", "option2", "option3", "option4"],
  "correctAnswer": "correct option text",
  "explanation": "explanation of the correct answer"
}`;

    console.log("Calling OpenAI API...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0].message.content;
    console.log("OpenAI response received:", content);

    // Ensure we have content and it's valid JSON
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    try {
      const parsedContent = JSON.parse(content.trim());
      return NextResponse.json(parsedContent);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      throw new Error("Failed to parse OpenAI response as JSON");
    }
  } catch (error) {
    console.error("Error generating question:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate question",
      },
      { status: 500 }
    );
  }
}
