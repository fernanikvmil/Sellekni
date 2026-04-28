import express from "express";
import Groq from 'groq-sdk';
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Tu es un assistant pour un site de petites annonces appelé Sellekni. Tu aides les utilisateurs à naviguer sur le site, publier des annonces, trouver des techniciens (plomberie, électricité, etc.). Réponds en français de manière naturelle et utile."
        },
        { role: "user", content: message }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    res.json({
      success: true,
      reply: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ error: "Erreur IA" });
  }
});

export default router;
