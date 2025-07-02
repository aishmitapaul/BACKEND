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


aapp.post('/api/summarize', async (req, res) => {
  const { text } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!text || !apiKey) {
    console.error(" Missing text or API key");
    return res.status(400).json({ error: 'Missing text or API key' });
  }

  
  function stripHtmlTags(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  const cleanText = stripHtmlTags(text);
  console.log("📥 Cleaned Text:", cleanText.slice(0, 300)); 

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

    console.log("📤 Gemini Response:\n", JSON.stringify(result, null, 2)); 

    
    if (result.error) {
      console.error("Gemini API Error:", result.error.message || result.error);
      return res.status(500).json({ error: result.error.message || 'Gemini API error' });
    }

    
    const summaryText = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!summaryText) {
      console.error(" No summary returned:", JSON.stringify(result, null, 2));
      return res.status(500).json({ error: 'No summary returned' });
    }

    console.log(" Summary:", summaryText);
    res.json({ summary: summaryText });
  } catch (err) {
    console.error("API Request Error:", err);
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