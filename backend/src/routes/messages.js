import express from 'express'
import { Message, Notification } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';

const router = express.Router()

router.post("/message-post", requireAuth, async (req, res) => {
  try {
    const { annonceId, annonceTitre, de, a, message } = req.body;
    const msg = await Message.create({ annonceId, annonceTitre, de, a, message });
    await Notification.create({
      destinataire: a,
      type: "message",
      auteur: de,
      message: `${de} vous a envoyé un message : "${message.slice(0, 60)}${message.length > 60 ? "…" : ""}"`,
    });
    res.status(201).json({ message: "Message envoyé !", msg });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/:username/unread", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const count = await Message.countDocuments({ a: req.params.username, lu: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/:username", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const messages = await Message.find({
      $or: [{ a: req.params.username }, { de: req.params.username }]
    }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/:id/reponse", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ message: "Message vide" });
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message introuvable" });
    if (msg.a !== req.user.username && msg.de !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });
    msg.reponses.push({ de: req.user.username, message: message.trim() });
    await msg.save();
    // Notifier l'autre partie
    const recipient = msg.a === req.user.username ? msg.de : msg.a;
    await Notification.create({
      destinataire: recipient,
      type: "message",
      auteur: req.user.username,
      message: `${req.user.username} a répondu à votre message`,
    });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.patch("/:id/lu", requireAuth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: "Message introuvable" });
    if (msg.a !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });
    await msg.updateOne({ lu: true });
    res.json({ message: "Message marqué comme lu" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});


export default router