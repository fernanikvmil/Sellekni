import express from 'express'
import { Post, User, Notification } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../library/cloudinary.js';
import { moderateImageWithSightEngine } from '../middleware/moderation.js';

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({ deleted: { $ne: true } }).sort({ createdAt: -1 });
    const allUsernames = [...new Set([
      ...posts.map(p => p.auteur),
      ...posts.flatMap(p => p.commentaires.map(c => c.auteur)),
    ])];
    const users = await User.find({ username: { $in: allUsernames } }, { username: 1, photo: 1 });
    const photoMap = Object.fromEntries(users.map(u => [u.username, u.photo]));
    const enriched = posts.map(p => ({
      ...p.toObject(),
      auteurPhoto: photoMap[p.auteur] || null,
      commentaires: p.commentaires.map(c => ({ ...c.toObject(), auteurPhoto: photoMap[c.auteur] || null })),
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Vérification image avant publication
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
        message: `${auteur} a publié dans le forum`,
      })));
    }
    const author = await User.findOne({ username: auteur }, { photo: 1 });
    const postObj = { ...post.toObject(), auteurPhoto: author?.photo || null };
    res.status(201).json({ message: "Post publié !", post: postObj });
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
        lu: false,
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
    const author = await User.findOne({ username: auteur }, { photo: 1 });
    // Notifier l'auteur du post (pas lui-même)
    if (auteur !== post.auteur) {
      await Notification.create({
        destinataire: post.auteur,
        type: "commentaire",
        auteur,
        postId: post._id.toString(),
        message: `${auteur} a commenté`,
      });
    }
    res.status(201).json({ commentaire: { ...commentaire.toObject(), auteurPhoto: author?.photo || null } });
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
    post.deleted = true;
    post.deletedAt = new Date();
    await post.save();
    res.json({ message: "Post supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.patch("/:id/restore", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post introuvable" });
    if (post.auteur !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });
    post.deleted = false;
    post.deletedAt = null;
    await post.save();
    res.json({ message: "Post restauré", post });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Signalement d'un post ─────────────────────────────────────────────────────
router.post("/:id/signaler", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post introuvable" });

    const dejaSignale = post.signalements?.some(s => s.par === req.user.username);
    if (dejaSignale) return res.status(400).json({ message: "Vous avez déjà signalé ce post" });

    post.signalements = post.signalements || [];
    post.signalements.push({ par: req.user.username, raison: req.body.raison || "" });
    await post.save();
    res.json({ message: "Post signalé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router