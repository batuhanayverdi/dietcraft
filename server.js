const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("❌ OpenAI API Key is missing! Check your .env file.");
  process.exit(1);
}

// 📌 OpenAI Vision API ile görsel analizi (gpt-4o)
app.post("/api/analyze-fridge", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    console.log("📸 Received Image:", req.file.originalname);

    const base64Image = req.file.buffer.toString("base64");

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an AI assistant. The user has uploaded the contents of their fridge. Identify the food items in the image and return only the names of the foods as a list."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "What food items are in this image? Provide a list." },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } } // 📌 DOĞRU FORMAT
            ]
          }
        ],
        max_tokens: 200
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const result = response.data.choices[0].message.content
    .split("\n") // Satırlara ayır
    .map(item => item.replace(/^- /, "").trim()) // Başındaki "-" işaretlerini ve boşlukları temizle
    .filter(item => item.length > 0); // Boş stringleri kaldır
  
    console.log("✅ OpenAI API Response (Array Format):", result);
    res.json({ foods: result }); // Artık "foods" bir array olacak

  } catch (error) {
    console.error(
      "❌ OpenAI API Request Failed:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Failed to analyze fridge contents" });
  }
});

// 📌 Backend Sunucusunu Başlat
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
