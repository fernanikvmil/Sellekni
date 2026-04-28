import express from 'express'
import { User, Annonce, Post } from '../models/Schemas.js'
import { requireAuth } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", port: 587, secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

const router = express.Router()

router.get("/techniciens", async (req, res) => {
  try {
    const { wilaya, specialite, role } = req.query;
    const filter = { role: role || "technicien" };
    if (wilaya && wilaya !== "all") filter.wilaya = wilaya;
    if (specialite && specialite !== "all") filter.specialite = specialite;

    const users = await User.find(filter, {
      password: 0, verificationToken: 0, verificationCode: 0,
      verificationCodeExpiry: 0, resetPasswordToken: 0, resetPasswordExpires: 0,
    });

    const result = users.map(u => {
      const notations = u.notations || [];
      const moyenne = notations.length
        ? notations.reduce((s, n) => s + n.note, 0) / notations.length
        : 0;
      return {
        username: u.username,
        photo: u.photo,
        specialite: u.specialite,
        wilaya: u.wilaya,
        bio: u.bio,
        lastSeen: u.lastSeen,
        totalNotes: notations.length,
        moyenne: parseFloat(moyenne.toFixed(1)),
        location: u.location || null,
      };
    }).sort((a, b) => b.moyenne - a.moyenne || b.totalNotes - a.totalNotes);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q, wilaya } = req.query;
    const filter = {};
    if (q && q.trim().length >= 1) filter.username = { $regex: q.trim(), $options: "i" };
    if (wilaya && wilaya !== "all") filter.wilaya = wilaya;
    if (!q && !wilaya) return res.json([]);

    const users = await User.find(filter, { username: 1, role: 1, photo: 1, wilaya: 1, specialite: 1, notations: 1 }).limit(20);

    const result = users.map(u => ({
      username: u.username,
      role: u.role,
      photo: u.photo,
      wilaya: u.wilaya,
      specialite: u.specialite,
      moyenne: u.notations?.length
        ? parseFloat((u.notations.reduce((s, n) => s + n.note, 0) / u.notations.length).toFixed(1))
        : 0,
      totalNotes: u.notations?.length || 0,
    })).sort((a, b) => b.moyenne - a.moyenne || b.totalNotes - a.totalNotes);

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
    const { username, Firstname, Lastname, bio, telephone, wilaya, specialite, dateNaissance } = req.body;
    if (username && username.trim().length < 3)
      return res.status(400).json({ message: "Le nom d'utilisateur doit contenir au moins 3 caractères." });
    if (username && username !== req.params.username) {
      const exists = await User.findOne({ username: username.trim() });
      if (exists) return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris." });
    }
    const update = {};
    if (username)   update.username   = username.trim();
    if (Firstname !== undefined)      update.Firstname     = Firstname;
    if (Lastname !== undefined)       update.Lastname      = Lastname;
    if (bio !== undefined)            update.bio           = bio;
    if (telephone !== undefined)      update.telephone     = telephone;
    if (wilaya !== undefined)         update.wilaya        = wilaya;
    if (specialite !== undefined)     update.specialite    = specialite;
    if (dateNaissance !== undefined)  update.dateNaissance = dateNaissance;
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

router.patch("/:username/location", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const { lat, lng } = req.body;
    if (typeof lat !== "number" || typeof lng !== "number")
      return res.status(400).json({ message: "Coordonnées invalides" });
    await User.findOneAndUpdate({ username: req.params.username }, { location: { lat, lng } });
    res.json({ ok: true });
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


// ── Historique publications ──────────────────────────────────────────────────
router.get("/:username/history", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const [annonces, posts] = await Promise.all([
      Annonce.find({ auteur: req.params.username, deleted: { $ne: true } })
        .select("titre categorie prix wilaya photo createdAt")
        .sort({ createdAt: -1 }),
      Post.find({ auteur: req.params.username, deleted: { $ne: true } })
        .select("contenu photo likes commentaires createdAt")
        .sort({ createdAt: -1 }),
    ]);
    res.json({ annonces, posts });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Contenu supprimé récemment (30 derniers jours) ───────────────────────────
router.get("/:username/deleted", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [annonces, posts] = await Promise.all([
      Annonce.find({ auteur: req.params.username, deleted: true, deletedAt: { $gte: since } })
        .select("titre categorie prix wilaya photo createdAt deletedAt")
        .sort({ deletedAt: -1 }),
      Post.find({ auteur: req.params.username, deleted: true, deletedAt: { $gte: since } })
        .select("contenu photo createdAt deletedAt")
        .sort({ deletedAt: -1 }),
    ]);
    res.json({ annonces, posts });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Envoi code changement de mot de passe ────────────────────────────────────
router.post("/:username/send-password-code", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.pwdChangeCode = code;
    user.pwdChangeCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await transporter.sendMail({
      from: `"sellekni" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Code de confirmation - Changement de mot de passe",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:linear-gradient(135deg,#0a0a0f,#1a1a2e);border-radius:20px;">
          <h1 style="color:#a855f7;text-align:center;">sellekni</h1>
          <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:30px;">
            <h2 style="color:white;text-align:center;">Changement de mot de passe</h2>
            <p style="color:#cbd5e1;text-align:center;">Votre code de confirmation :</p>
            <div style="text-align:center;margin:30px 0;">
              <div style="display:inline-block;background:#1e1e2e;padding:15px 30px;border-radius:12px;border:2px solid #a855f7;">
                <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#a855f7;">${code}</span>
              </div>
            </div>
            <p style="color:#94a3b8;text-align:center;">Ce code expire dans <strong>10 minutes</strong>.</p>
            <p style="color:#94a3b8;text-align:center;">Si vous n'avez pas demandé ce changement, ignorez cet email.</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: "Code envoyé à votre email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de l'envoi" });
  }
});

// ── Changement de mot de passe avec code ─────────────────────────────────────
router.post("/:username/change-password", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });
    const { code, newPassword } = req.body;
    if (!code || !newPassword)
      return res.status(400).json({ message: "Code et nouveau mot de passe requis" });

    const pwdRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!pwdRegex.test(newPassword))
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères, une majuscule et un caractère spécial." });

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });
    if (!user.pwdChangeCode || user.pwdChangeCode !== code)
      return res.status(400).json({ message: "Code invalide" });
    if (user.pwdChangeCodeExpiry < new Date())
      return res.status(400).json({ message: "Code expiré. Demandez un nouveau code." });

    user.password = await bcrypt.hash(newPassword, 10);
    user.pwdChangeCode = null;
    user.pwdChangeCodeExpiry = null;
    await user.save();
    res.json({ success: true, message: "Mot de passe modifié avec succès !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Suppression du compte ────────────────────────────────────────────────────
router.delete("/:username/delete-account", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Soft-delete des annonces et posts
    await Promise.all([
      Annonce.updateMany({ auteur: req.params.username }, { $set: { deleted: true, deletedAt: new Date() } }),
      Post.updateMany({ auteur: req.params.username }, { $set: { deleted: true, deletedAt: new Date() } }),
    ]);

    // Supprimer l'utilisateur
    await User.deleteOne({ username: req.params.username });

    res.json({ success: true, message: "Compte supprimé définitivement." });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router