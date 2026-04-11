import express, { Router } from 'express'
import { Service } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../library/cloudinary.js';

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const { categorie } = req.query;
    const filter = categorie && categorie !== "tous" ? { categorie } : {};
    const services = await Service.find(filter).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});


router.post("/", requireAuth, upload.single("photo"), async (req, res) => {
  try {
    const { titre, description, prix, categorie, auteur, role, wilaya } = req.body;
    if (!titre || !description || !prix || !categorie)
      return res.status(400).json({ message: "Tous les champs sont requis" });
    const photoUrl = req.file ? (req.file.secure_url || req.file.path) : null;
    const service = await Service.create({
      titre, description, prix, categorie, auteur, role,
      photo: photoUrl,
      wilaya: wilaya || "",
    });
    res.status(201).json({ message: "Service publié !", service });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service introuvable" });
    res.json(service);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/:id/commentaires", requireAuth, async (req, res) => {
  try {
    const { contenu, auteur, role } = req.body;
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service introuvable" });
    if (!contenu) return res.status(400).json({ message: "Commentaire vide" });
    service.commentaires.push({ contenu, auteur, role });
    await service.save();
    const commentaire = service.commentaires[service.commentaires.length - 1];
    res.status(201).json({ commentaire });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service introuvable" });
    if (service.auteur !== req.user.username) return res.status(403).json({ message: "Non autorisé" });
    const { titre, description, prix } = req.body;
    if (titre) service.titre = titre;
    if (description) service.description = description;
    if (prix !== undefined) service.prix = prix;
    await service.save();
    res.json({ message: "Service modifié !", service });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service introuvable" });
    if (service.auteur !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });
    await service.deleteOne();
    res.json({ message: "Service supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router