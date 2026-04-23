const GITHUB_API_KEY =
  "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";

async function callModel() {
  const response = await fetch(
    "https://models.github.ai/inference/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GITHUB_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Whats 1+12?." },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    },
  );

  const data = await response.json();
  console.log(data.choices[0].message.content);
}

callModel().catch(console.error);
