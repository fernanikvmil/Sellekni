import express from 'express'
import { Service, Notification, User } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../library/cloudinary.js';
import { moderateImage, moderateImageWithSightEngine } from '../middleware/moderation.js';

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
    const service = await Service.create({
      titre, description, prix: Number(prix), categorie,
      auteur: auteur || req.user?.username || "Anonyme",
      role: role || req.user?.role || "client",
      photo: photoUrl,
      wilaya: wilaya || "",
      moderated: true,
      moderatedAt: new Date()
    });
    res.status(201).json({ message: "Service publié !", service });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service introuvable" });

    let vendeur = null;
    if (service.auteur) {
      const user = await User.findOne({ username: service.auteur });
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
      ...service.toObject(),
      vendeur
    });
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
    if (auteur !== service.auteur) {
      await Notification.create({
        destinataire: service.auteur,
        type: "commentaire_service",
        auteur,
        postId: service._id.toString(),
        message: `${auteur} a commenté votre service "${service.titre}"`,
      });
    }
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

// ── Signalement d'un service ──────────────────────────────────────────────────
router.post("/:id/signaler", requireAuth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Service introuvable" });

    const dejaSignale = service.signalements?.some(s => s.par === req.user.username);
    if (dejaSignale) return res.status(400).json({ message: "Vous avez déjà signalé ce service" });

    service.signalements = service.signalements || [];
    service.signalements.push({ par: req.user.username, raison: req.body.raison || "" });
    await service.save();
    res.json({ message: "Service signalé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router
