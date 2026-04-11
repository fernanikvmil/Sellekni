import express from 'express'
import { User, Annonce, Post } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';

const router = express.Router()

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1) return res.json([]);
    const users = await User.find(
      { username: { $regex: q.trim(), $options: "i" } },
      { username: 1, role: 1, photo: 1, ville: 1, notations: 1 }
    ).limit(8);
    const result = users.map(u => ({
      username: u.username,
      role: u.role,
      photo: u.photo,
      ville: u.ville,
      moyenne: u.notations?.length
        ? (u.notations.reduce((s, n) => s + n.note, 0) / u.notations.length).toFixed(1)
        : null,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }, {
      password: 0, verificationToken: 0, emailVerified: 0, email: 0,
    });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });


    const annonces = await Annonce.find({ auteur: req.params.username }).sort({ createdAt: -1 });
    const postsCount = await Post.countDocuments({ auteur: req.params.username });
    const notations = user.notations || [];
    const moyenne = notations.length
      ? (notations.reduce((s, n) => s + n.note, 0) / notations.length).toFixed(1)
      : null;
    const totalPublications = annonces.length + postsCount;
    let badge = null;
    if (totalPublications >= 20) badge = { label: "Membre régulier", color: "yellow", icon: "⭐" };
    else if (totalPublications >= 8) badge = { label: "Membre actif", color: "green", icon: "🔥" };
    else if (totalPublications >= 3) badge = { label: "Contributeur", color: "blue", icon: "✨" };
    res.json({ user, annonces, moyenne, totalNotes: notations.length, postsCount, badge });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.patch("/:username/modifier", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const { username, bio, telephone, wilaya, specialite } = req.body;
    if (username && username.trim().length < 3)
      return res.status(400).json({ message: "Le nom d'utilisateur doit contenir au moins 3 caractères." });
    if (username && username !== req.params.username) {
      const exists = await User.findOne({ username: username.trim() });
      if (exists) return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris." });
    }
    const update = {};
    if (username)   update.username   = username.trim();
    if (bio !== undefined)        update.bio        = bio;
    if (telephone !== undefined)  update.telephone  = telephone;
    if (wilaya !== undefined)     update.wilaya     = wilaya;
    if (specialite !== undefined) update.specialite = specialite;
    const user = await User.findOneAndUpdate(
      { username: req.params.username },
      update,
      { returnDocument: "after" }
    );
    res.json({ message: "Profil mis à jour !", user });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.patch("/:username/heartbeat", requireAuth, async (req, res) => {
  try {
    await User.findOneAndUpdate({ username: req.params.username }, { lastSeen: new Date() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/:username/noter", requireAuth, async (req, res) => {
  try {
    
    const { auteur, note } = req.body;
    if (!auteur || !note || note < 1 || note > 5)
      return res.status(400).json({ message: "Note invalide (1-5)" });
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    if (!user.notations) user.notations = [];
    const existant = user.notations.findIndex(n => n.auteur === auteur);
    if (existant !== -1) user.notations[existant].note = note;
    else user.notations.push({ auteur, note });
    await user.save();
    const moyenne = (user.notations.reduce((s, n) => s + n.note, 0) / user.notations.length).toFixed(1);
    res.json({ moyenne, totalNotes: user.notations.length });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});


export default router