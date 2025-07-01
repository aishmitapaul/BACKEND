import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const savedSummaries = [];


app.post('/api/summarize', async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!text || !apiKey) {
    return res.status(400).json({ error: 'Missing text or API key' });
  }

  // Remove HTML tags
  function stripHtmlTags(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  const cleanText = stripHtmlTags(text);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Summarize the following in 3 concise bullet points:\n\n${cleanText}`
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    const summaryText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summaryText) {
      console.error("Gemini API failed:", result);
      return res.status(500).json({ error: 'No summary returned' });
    }

    res.json({ summary: summaryText });
  } catch (err) {
    console.error("API Error:", err);
    res.status(500).json({ error: 'Summarization failed.' });
  }
});



app.post('/api/save-summary', (req, res) => {
  const { title, source, publishedAt, url, summary } = req.body;

  if (!title || !summary) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const newSummary = {
    title,
    source,
    publishedAt,
    url,
    summary,
    timestamp: Date.now()
  };

  savedSummaries.push(newSummary);
  console.log(" Saved summary:", newSummary);
  res.status(201).json({ message: 'Summary saved successfully.' });
});


app.get('/api/summaries', (req, res) => {
  console.log(" Sending all saved summaries");
  res.json(savedSummaries);
});

app.get('/',(req,res)=>{
  res.send('API is running successful');
});
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});