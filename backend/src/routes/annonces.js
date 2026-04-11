import express from 'express'
import { Annonce } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../library/cloudinary.js';

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const { categorie } = req.query;
    const filter = categorie && categorie !== "tous" ? { categorie } : {};
    const annonces = await Annonce.find(filter).sort({ createdAt: -1 });
    res.json(annonces);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/", requireAuth, upload.single("photo"), async (req, res) => {
  try {
    const { titre, description, prix, categorie, auteur, role } = req.body;
    if (!titre || !description || !prix || !categorie) return res.status(400).json({ message: "Tous les champs sont requis" });
    const { wilaya } = req.body;
    const photoUrl = req.file ? (req.file.secure_url || req.file.path) : null;
    const annonce = await Annonce.create({
      titre, description, prix, categorie, auteur, role,
      photo: photoUrl,
      wilaya: wilaya || "",
    });
    res.status(201).json({ message: "Annonce publiée !", annonce });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) return res.status(404).json({ message: "Annonce introuvable" });
    res.json(annonce);
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
    await annonce.deleteOne();
    res.json({ message: "Annonce supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router