export async function generateQuestion() {
  console.log("Calling generate question API...");
  const response = await fetch("/api/generate-question", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to generate question:", error);
    throw new Error(`Failed to generate question: ${error}`);
  }

  const data = await response.json();
  console.log("Question generated:", data);
  return data;
}
