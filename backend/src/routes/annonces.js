import express from 'express'
import { Annonce, Notification, User } from '../models/Schemas.js'

import { requireAuth } from '../middleware/auth.js';
import { upload } from '../library/cloudinary.js';
import { moderateImage, moderateImageWithSightEngine } from '../middleware/moderation.js';

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const { categorie } = req.query;
    const filter = categorie && categorie !== "tous" ? { categorie } : {};
    filter.deleted = { $ne: true };
    const annonces = await Annonce.find(filter).sort({ createdAt: -1 });
    res.json(annonces);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/check-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ safe: false, message: "Aucune image" });
    const imageUrl = req.file.secure_url || req.file.path;
    const result = await moderateImageWithSightEngine(imageUrl);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.json({ safe: true });
  }
});

router.post("/", requireAuth, upload.single("photo"), moderateImage, async (req, res) => {
  try {
    const { titre, description, prix, categorie, auteur, role, wilaya } = req.body;
    if (!titre || !description || !prix || !categorie)
      return res.status(400).json({ message: "Tous les champs sont requis" });
    const photoUrl = req.file ? (req.file.secure_url || req.file.path) : null;
    const annonce = await Annonce.create({
      titre, description, prix: Number(prix), categorie,
      auteur: auteur || req.user?.username || "Anonyme",
      role: role || req.user?.role || "client",
      photo: photoUrl,
      wilaya: wilaya || "",
      moderated: true,
      moderatedAt: new Date()
    });
    res.status(201).json({ message: "Annonce publiée !", annonce });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) return res.status(404).json({ message: "Annonce introuvable" });

    let vendeur = null;
    if (annonce.auteur) {
      const user = await User.findOne({ username: annonce.auteur });
      if (user) {
        vendeur = {
          username: user.username,
          photo: user.photo,
          role: user.role,
          moyenne: user.moyenne,
          totalNotes: user.totalNotes
        };
      }
    }

    res.json({
      ...annonce.toObject(),
      vendeur
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/:id/commentaires", requireAuth, async (req, res) => {
  try {
    const { contenu, auteur, role } = req.body;
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) return res.status(404).json({ message: "Annonce introuvable" });
    if (!contenu) return res.status(400).json({ message: "Commentaire vide" });
    annonce.commentaires.push({ contenu, auteur, role });
    await annonce.save();
    const commentaire = annonce.commentaires[annonce.commentaires.length - 1];
    if (auteur !== annonce.auteur) {
      await Notification.create({
        destinataire: annonce.auteur,
        type: "commentaire_annonce",
        auteur,
        postId: annonce._id.toString(),
        message: `${auteur} a commenté votre annonce "${annonce.titre}"`,
      });
    }
    res.status(201).json({ commentaire });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) return res.status(404).json({ message: "Annonce introuvable" });
    if (annonce.auteur !== req.user.username) return res.status(403).json({ message: "Non autorisé" });
    const { titre, description, prix } = req.body;
    if (titre) annonce.titre = titre;
    if (description) annonce.description = description;
    if (prix !== undefined) annonce.prix = prix;
    await annonce.save();
    res.json({ message: "Annonce modifiée !", annonce });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) return res.status(404).json({ message: "Annonce introuvable" });
    if (annonce.auteur !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });
    annonce.deleted = true;
    annonce.deletedAt = new Date();
    await annonce.save();
    res.json({ message: "Annonce supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.patch("/:id/restore", requireAuth, async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) return res.status(404).json({ message: "Annonce introuvable" });
    if (annonce.auteur !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });
    annonce.deleted = false;
    annonce.deletedAt = null;
    await annonce.save();
    res.json({ message: "Annonce restaurée", annonce });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Signalement d'une annonce ─────────────────────────────────────────────────
router.post("/:id/signaler", requireAuth, async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) return res.status(404).json({ message: "Annonce introuvable" });

    const dejaSignale = annonce.signalements?.some(s => s.par === req.user.username);
    if (dejaSignale) return res.status(400).json({ message: "Vous avez déjà signalé cette annonce" });

    annonce.signalements = annonce.signalements || [];
    annonce.signalements.push({ par: req.user.username, raison: req.body.raison || "" });
    await annonce.save();
    res.json({ message: "Annonce signalée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router
