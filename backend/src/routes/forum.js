import express from 'express'
import { Post, User, Notification } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../library/cloudinary.js';

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/", requireAuth, upload.single("photo"), async (req, res) => {
  try {
    const { contenu, auteur, role } = req.body;
    if (!contenu) return res.status(400).json({ message: "Le contenu est requis" });
    const post = await Post.create({
      contenu, auteur, role,
      photo: req.file ? req.file.path : null,
    });
    // Notifier tous les autres utilisateurs
    const autresUsers = await User.find({ username: { $ne: auteur }, emailVerified: true }, { username: 1 });
    if (autresUsers.length > 0) {
      await Notification.insertMany(autresUsers.map(u => ({
        destinataire: u.username,
        type: "forum",
        auteur,
        postId: post._id.toString(),
        message: `${auteur} a publié dans le forum : "${contenu.slice(0, 60)}${contenu.length > 60 ? "…" : ""}"`,
      })));
    }
    res.status(201).json({ message: "Post publié !", post });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/:id/like", async (req, res) => {
  try {
    const { username } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post introuvable" });
    const index = post.likes.indexOf(username);
    if (index === -1) {
      post.likes.push(username);
      // Notifier l'auteur du post (pas lui-même)
      if (username !== post.auteur) {
        await Notification.create({
          destinataire: post.auteur,
          type: "like",
          auteur: username,
          postId: post._id.toString(),
          message: `${username} a aimé votre publication`,
        });
      }
    } else {
      post.likes.splice(index, 1);
    }
    await post.save();
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/:id/commentaires", requireAuth, async (req, res) => {
  try {
    const { contenu, auteur, role } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post introuvable" });
    if (!contenu) return res.status(400).json({ message: "Commentaire vide" });
    post.commentaires.push({ contenu, auteur, role });
    await post.save();
    const commentaire = post.commentaires[post.commentaires.length - 1];
    // Notifier l'auteur du post (pas lui-même)
    if (auteur !== post.auteur) {
      await Notification.create({
        destinataire: post.auteur,
        type: "commentaire",
        auteur,
        postId: post._id.toString(),
        message: `${auteur} a commenté : "${contenu.slice(0, 60)}${contenu.length > 60 ? "…" : ""}"`,
      });
    }
    res.status(201).json({ commentaire });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post introuvable" });
    if (post.auteur !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });
    await post.deleteOne();
    res.json({ message: "Post supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router