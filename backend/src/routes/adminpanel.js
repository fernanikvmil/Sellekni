import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Annonce, Service, Post } from '../models/Schemas.js';

const router = express.Router();

const ADMIN_EMAIL = "sidhou999@gmail.com";

// ── Middlewares ───────────────────────────────────────────────────────────────
const requireAdmin = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Non authentifié." });
  }
  try {
    const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("email isAdmin");
    if (!user || (user.email !== ADMIN_EMAIL && !user.isAdmin)) {
      return res.status(403).json({ message: "Accès refusé." });
    }
    req.adminUser = user;
    req.isSuperAdmin = user.email === ADMIN_EMAIL;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

const requireSuperAdmin = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Non authentifié." });
  }
  try {
    const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("email");
    if (!user || user.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: "Réservé au super-administrateur." });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
};

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email et mot de passe requis." });
  }
  try {
    const user = await User.findOne({ email }).select("email password isAdmin");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    // Only superadmin OR users with isAdmin flag can log in
    if (user.email !== ADMIN_EMAIL && !user.isAdmin) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Mot de passe incorrect." });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    const isSuperAdmin = user.email === ADMIN_EMAIL;
    res.json({ token, isSuperAdmin, message: "Connecté avec succès." });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/verify", requireAdmin, (req, res) => {
  res.json({ valid: true, isSuperAdmin: req.isSuperAdmin || false });
});

// ── Gestion des admins (superadmin seulement) ─────────────────────────────────
router.get("/admins/list", requireSuperAdmin, async (req, res) => {
  try {
    const admins = await User.find(
      { isAdmin: true },
      { username: 1, email: 1, photo: 1, createdAt: 1 }
    ).sort({ createdAt: -1 });
    res.json({ admins });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/admins/add", requireSuperAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis." });
    if (email === ADMIN_EMAIL) return res.status(400).json({ message: "Ce compte est déjà super-administrateur." });

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { isAdmin: true } },
      { new: true, select: "username email photo isAdmin" }
    );
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    res.json({ message: `${user.username} est maintenant administrateur.`, user });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.delete("/admins/:id", requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("email isAdmin");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    if (user.email === ADMIN_EMAIL) return res.status(400).json({ message: "Impossible de révoquer le super-administrateur." });

    user.isAdmin = false;
    await user.save();
    res.json({ message: "Droits administrateur révoqués." });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Utilitaire : derniers N jours ─────────────────────────────────────────────
const buildDays = (n = 10) => {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    days.push({
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      start: new Date(d),
      end,
    });
  }
  return days;
};

// ── Stats counts ──────────────────────────────────────────────────────────────
router.get("/users/count", requireAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/annonces/count", requireAdmin, async (req, res) => {
  try {
    const [a, s] = await Promise.all([
      Annonce.countDocuments(),
      Service.countDocuments(),
    ]);
    res.json({ count: a + s });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/posts/count", requireAdmin, async (req, res) => {
  try {
    const count = await Post.countDocuments();
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Charts ────────────────────────────────────────────────────────────────────
router.get("/annonces/chart", requireAdmin, async (req, res) => {
  try {
    const days = buildDays(10);
    const data = await Promise.all(
      days.map(async ({ date, start, end }) => {
        const [annonces, services] = await Promise.all([
          Annonce.countDocuments({ createdAt: { $gte: start, $lt: end } }),
          Service.countDocuments({ createdAt: { $gte: start, $lt: end } }),
        ]);
        return { date, annonces, services };
      })
    );
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/posts/chart", requireAdmin, async (req, res) => {
  try {
    const days = buildDays(10);
    const data = await Promise.all(
      days.map(async ({ date, start, end }) => {
        const count = await Post.countDocuments({ createdAt: { $gte: start, $lt: end } });
        return { date, count };
      })
    );
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Lists ─────────────────────────────────────────────────────────────────────
router.get("/users/list", requireAdmin, async (req, res) => {
  try {
    const items = await User.find(
      {},
      { password: 0, verificationCode: 0, verificationCodeExpiry: 0, resetPasswordToken: 0, resetPasswordExpires: 0 }
    ).sort({ createdAt: -1 }).limit(500);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/annonces/list", requireAdmin, async (req, res) => {
  try {
    const [annonces, services] = await Promise.all([
      Annonce.find().sort({ createdAt: -1 }).limit(200),
      Service.find().sort({ createdAt: -1 }).limit(200),
    ]);
    const items = [
      ...annonces.map(a => ({ ...a.toObject(), type: "annonce" })),
      ...services.map(s => ({ ...s.toObject(), type: "service" })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/posts/list", requireAdmin, async (req, res) => {
  try {
    const items = await Post.find().sort({ createdAt: -1 }).limit(200);
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Modération : contenu signalé ──────────────────────────────────────────────
// Schema léger en mémoire (pas de collection dédiée, on filtre les signalements)
// Les signalements sont stockés dans les modèles avec le champ `signalements`

router.get("/moderation/signaled", requireAdmin, async (req, res) => {
  try {
    // Récupérer posts et annonces/services signalés
    const [posts, annonces, services] = await Promise.all([
      Post.find({ "signalements.0": { $exists: true } }).sort({ createdAt: -1 }).limit(100),
      Annonce.find({ "signalements.0": { $exists: true } }).sort({ createdAt: -1 }).limit(100),
      Service.find({ "signalements.0": { $exists: true } }).sort({ createdAt: -1 }).limit(100),
    ]);

    const items = [
      ...posts.map(p => ({
        _id: p._id + "_p",
        contentId: p._id,
        contentType: "post",
        contentPreview: p.contenu?.slice(0, 120) || "",
        contentAuthor: p.auteur,
        signaledBy: p.signalements?.map(s => s.par).join(", ") || "—",
        reason: p.signalements?.[0]?.raison || "",
        createdAt: p.signalements?.[0]?.date || p.createdAt,
      })),
      ...annonces.map(a => ({
        _id: a._id + "_a",
        contentId: a._id,
        contentType: "annonce",
        contentPreview: a.titre + " — " + (a.description?.slice(0, 80) || ""),
        contentAuthor: a.auteur,
        signaledBy: a.signalements?.map(s => s.par).join(", ") || "—",
        reason: a.signalements?.[0]?.raison || "",
        createdAt: a.signalements?.[0]?.date || a.createdAt,
      })),
      ...services.map(s => ({
        _id: s._id + "_s",
        contentId: s._id,
        contentType: "service",
        contentPreview: s.titre + " — " + (s.description?.slice(0, 80) || ""),
        contentAuthor: s.auteur,
        signaledBy: s.signalements?.map(x => x.par).join(", ") || "—",
        reason: s.signalements?.[0]?.raison || "",
        createdAt: s.signalements?.[0]?.date || s.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Ignorer un signalement (vider le tableau signalements)
router.patch("/moderation/:id/ignorer", requireAdmin, async (req, res) => {
  // id format: mongoId_p | mongoId_a | mongoId_s
  const parts = req.params.id.split("_");
  const suffix = parts[parts.length - 1];
  const mongoId = parts.slice(0, -1).join("_");

  try {
    if (suffix === "p") {
      await Post.findByIdAndUpdate(mongoId, { $set: { signalements: [] } });
    } else if (suffix === "a") {
      await Annonce.findByIdAndUpdate(mongoId, { $set: { signalements: [] } });
    } else {
      await Service.findByIdAndUpdate(mongoId, { $set: { signalements: [] } });
    }
    res.json({ message: "Signalement ignoré" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Voir le contenu signalé (renvoie 404 si déjà supprimé)
router.get("/content/:type/:id", requireAdmin, async (req, res) => {
  const { type, id } = req.params;
  try {
    let content = null;
    if (type === "post") {
      content = await Post.findById(id);
    } else if (type === "annonce") {
      content = await Annonce.findById(id);
      if (!content) content = await Service.findById(id);
    } else if (type === "service") {
      content = await Service.findById(id);
    }
    if (!content) return res.status(404).json({ message: "Contenu introuvable ou déjà supprimé." });
    res.json({ content });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// Effacer tout l'historique des signalements
router.delete("/moderation/all", requireAdmin, async (req, res) => {
  try {
    await Promise.all([
      Post.updateMany({ "signalements.0": { $exists: true } }, { $set: { signalements: [] } }),
      Annonce.updateMany({ "signalements.0": { $exists: true } }, { $set: { signalements: [] } }),
      Service.updateMany({ "signalements.0": { $exists: true } }, { $set: { signalements: [] } }),
    ]);
    res.json({ message: "Historique effacé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── User: changer rôle ────────────────────────────────────────────────────────
router.patch("/users/:id/role", requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!["client", "technicien"].includes(role)) {
    return res.status(400).json({ message: "Rôle invalide." });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true, select: "-password" }
    );
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    res.json({ message: "Rôle mis à jour", user });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ── Suppressions ──────────────────────────────────────────────────────────────
router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.delete("/annonces/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Annonce.findByIdAndDelete(req.params.id);
    if (!deleted) await Service.findByIdAndDelete(req.params.id);
    res.json({ message: "Supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.delete("/posts/:id", requireAdmin, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post supprimé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router;
