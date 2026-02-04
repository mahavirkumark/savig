import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve HTML file

const OPENAI_API_KEY = "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"; // your API key

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-5",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message }
      ]
    })
  });

  const data = await response.json();
  res.json(data);
});

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
