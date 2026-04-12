import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dns from "dns/promises";
import { User } from "../models/Schemas.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../library/mailer.js";

const router = express.Router();

// ─── INSCRIPTION ───────────────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role, telephone, dateNaissance, wilaya, specialite } = req.body;

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: "Adresse email invalide." });

    const domain = email.split("@")[1];
    const knownDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com", "msn.com", "aol.com"];
    if (!knownDomains.includes(domain.toLowerCase())) {
      try {
        await dns.resolveMx(domain);
      } catch {
        return res.status(400).json({ message: "Ce domaine email n'existe pas." });
      }
    }

    // Validation username
    if (!username || username.trim().length < 3)
      return res.status(400).json({ message: "Le nom d'utilisateur doit contenir au moins 3 caractères." });

    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email déjà utilisé" });

    // Validation mot de passe
    const pwdRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!pwdRegex.test(password))
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères, une majuscule et un caractère spécial." });

    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await User.create({
      username,
      email,
      password: hashed,
      role,
      verificationToken,
      emailVerified: false,
      telephone: telephone || "",
      dateNaissance: dateNaissance || "",
      wilaya: wilaya || "",
      specialite: specialite || "",
    });

    // Envoi email non bloquant (Resend)
    sendVerificationEmail(email, verificationToken)
      .catch(err => console.error("Erreur envoi email:", err.message));

    res.status(201).json({ message: "Compte créé ! Vérifiez votre email pour l'activer." });
  } catch (err) {
    console.error("Erreur signup :", err.message);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─── CONNEXION ─────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Aucun compte associé à cet email." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Mot de passe incorrect." });
    if (!user.emailVerified) return res.status(403).json({ message: "Veuillez vérifier votre email avant de vous connecter." });

    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Connecté !",
      token,
      user: { username: user.username, email: user.email, role: user.role, photo: user.photo },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─── VÉRIFICATION EMAIL (query param ?token=) ──────────────────────────────────
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Token manquant." });

    const user = await User.findOneAndUpdate(
      { verificationToken: token, emailVerified: false },
      { emailVerified: true, verificationToken: null },
      { new: true }
    );

    if (!user) return res.status(400).json({ message: "Token invalide ou déjà utilisé." });

    res.json({ message: "Email vérifié avec succès !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─── RENVOI EMAIL DE VÉRIFICATION ──────────────────────────────────────────────
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Réponse neutre pour ne pas exposer si l'email existe
    if (!user || user.emailVerified) {
      return res.status(200).json({ message: "Si ce compte existe, un email a été envoyé." });
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = newToken;
    await user.save();

    sendVerificationEmail(email, newToken)
      .catch(err => console.error("Erreur renvoi email:", err.message));

    res.status(200).json({ message: "Email de vérification renvoyé !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─── MOT DE PASSE OUBLIÉ ───────────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(200).json({ message: "Si ce compte existe, un email a été envoyé." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 min
    await user.save();

    sendPasswordResetEmail(email, resetToken)
      .catch(err => console.error("Erreur envoi reset email:", err.message));

    res.status(200).json({ message: "Si ce compte existe, un email a été envoyé." });
  } catch (err) {
    console.error("Erreur forgot-password:", err.message);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// ─── RÉINITIALISATION MOT DE PASSE ────────────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Lien invalide ou expiré." });

    const pwdRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!pwdRegex.test(password))
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères, une majuscule et un caractère spécial." });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Mot de passe réinitialisé avec succès !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router;
