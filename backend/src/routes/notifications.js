import express from 'express'
import { Notification } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';

const router = express.Router()

router.get("/:username/unread", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const count = await Notification.countDocuments({ destinataire: req.params.username, lu: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/:username", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const notifs = await Notification.find({ destinataire: req.params.username })
      .sort({ createdAt: -1 })
      .limit(30);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.patch("/:id/lu", requireAuth, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: "Notification introuvable" });
    if (notif.destinataire !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });
    await notif.updateOne({ lu: true });
    res.json({ message: "Lu" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.patch("/:username/tout-lire", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    await Notification.updateMany({ destinataire: req.params.username, lu: false }, { lu: true });
    res.json({ message: "Toutes les notifications marquées comme lues" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});


export default router