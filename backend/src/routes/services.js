
import express from 'express'
import multer from 'multer';
import { Service, Notification, User } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../library/cloudinary.js';
import { moderateImage, moderateImageBuffer } from '../middleware/moderation.js';

const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

router.post("/check-image", memUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ safe: false, message: "Aucune image" });
    const result = await moderateImageBuffer(req.file.buffer, req.file.mimetype);
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

    const commentairesAvecPhotos = await Promise.all(
      (service.commentaires || []).map(async (commentaire) => {
        let userPhoto = null;
        if (commentaire.auteur) {
          const user = await User.findOne({ username: commentaire.auteur });
          userPhoto = user?.photo || null;
        }
        return {
          ...commentaire.toObject(),
          photo: userPhoto
        };
      })
    );

    res.json({
      ...service.toObject(),
      vendeur,
      commentaires: commentairesAvecPhotos
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
    
    const user = await User.findOne({ username: auteur });
    const userPhoto = user?.photo || null;
    
    service.commentaires.push({ 
      contenu, 
      auteur, 
      role,
      photo: userPhoto
    });
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
    
    res.status(201).json({ 
      commentaire: {
        ...commentaire.toObject(),
        photo: userPhoto
      }
    });
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