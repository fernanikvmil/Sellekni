import express from 'express';
import { User } from '../models/Schemas.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Récupérer l'historique
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const history = (user.searchHistory || []).sort((a, b) =>
      new Date(b.consultedAt) - new Date(a.consultedAt)
    );
    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Ajouter un profil à l'historique
router.post("/add", requireAuth, async (req, res) => {
  try {
    const { username, photo, role, specialite, wilaya, moyenne } = req.body;

    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // Supprimer si déjà présent
    user.searchHistory = user.searchHistory.filter(item => item.username !== username);

    // Ajouter au début
    user.searchHistory.unshift({
      username,
      photo: photo || null,
      role: role || "client",
      specialite: specialite || null,
      wilaya: wilaya || null,
      moyenne: moyenne || 0,
      consultedAt: new Date()
    });

    // Garder seulement les 10 derniers
    if (user.searchHistory.length > 10) {
      user.searchHistory = user.searchHistory.slice(0, 10);
    }

    await user.save();
    res.json({ success: true, history: user.searchHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Supprimer un profil de l'historique
router.delete("/:username", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.searchHistory = user.searchHistory.filter(item => item.username !== req.params.username);
    await user.save();
    res.json({ success: true, history: user.searchHistory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Effacer tout l'historique
router.delete("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.searchHistory = [];
    await user.save();
    res.json({ success: true, message: "Historique effacé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
