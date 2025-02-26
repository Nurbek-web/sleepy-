import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function generateQuestion() {
  const prompt = `Generate a critical thinking question with 4 multiple choice options. Format as JSON:
  {
    "question": "question text",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "correct option text",
    "explanation": "explanation of the correct answer"
  }`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0].message.content;
  return content ? JSON.parse(content) : null;
}
