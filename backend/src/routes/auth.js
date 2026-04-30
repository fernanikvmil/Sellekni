import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/Schemas.js";
import { sendVerificationCodeEmail, sendPasswordResetEmail as mailjetResetEmail } from "../library/mailer.js";

const router = express.Router();

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── SIGNUP ────────────────────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { username, Firstname, Lastname, email, password, role, telephone, dateNaissance, wilaya, specialite } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: "Adresse email invalide." });

    if (!username || username.trim().length < 3)
      return res.status(400).json({ message: "Le nom d'utilisateur doit contenir au moins 3 caractères." });

    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris." });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email déjà utilisé" });

    const pwdRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!pwdRegex.test(password))
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères, une majuscule et un caractère spécial." });

    const hashed = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      username,
      Firstname: Firstname || "",
      Lastname: Lastname || "",
      email,
      password: hashed,
      role,
      verificationCode,
      verificationCodeExpiry,
      emailVerified: false,
      telephone: telephone || "",
      dateNaissance: dateNaissance || "",
      wilaya: wilaya || "",
      specialite: specialite || ""
    });

    console.log("=========================================");
    console.log(`📧 Email: ${email}`);
    console.log(`🔐 CODE DE VÉRIFICATION: ${verificationCode}`);
    console.log("=========================================");

    try {
      await sendVerificationCodeEmail(email, verificationCode, username);
      console.log("✅ Email envoyé avec succès");
    } catch (emailError) {
      console.log("⚠️ Email non envoyé:", emailError.message);
    }

    res.status(201).json({
      message: "Compte créé ! Vérifiez votre email avec le code",
      userId: user._id,
      requiresVerification: true
    });

  } catch (err) {
    console.error("Erreur signup:", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ─── VÉRIFICATION DU CODE ──────────────────────────────────────────────────────
router.post("/verify-code", async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ message: "Code requis." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (user.emailVerified) return res.status(400).json({ message: "Email déjà vérifié." });

    if (user.verificationCode !== code) return res.status(400).json({ message: "Code invalide." });

    if (user.verificationCodeExpiry < new Date()) {
      return res.status(400).json({ message: "Code expiré. Demandez un nouveau code." });
    }

    user.emailVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiry = null;
    await user.save();

    res.json({ message: "Email vérifié avec succès !" });

  } catch (err) {
    console.error("Erreur vérification:", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ─── RENVOYER LE CODE ──────────────────────────────────────────────────────────
router.post("/resend-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    if (user.emailVerified) return res.status(400).json({ message: "Email déjà vérifié." });

    const newCode = generateVerificationCode();
    user.verificationCode = newCode;
    user.verificationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log("=========================================");
    console.log(`📧 Renvoi code pour: ${email}`);
    console.log(`🔐 NOUVEAU CODE: ${newCode}`);
    console.log("=========================================");

    try {
      await sendVerificationCode(email, newCode, user.username);
      console.log("✅ Email renvoyé");
    } catch (emailError) {
      console.log("⚠️ Email non envoyé");
    }

    res.json({ message: "Nouveau code envoyé !" });

  } catch (err) {
    console.error("Erreur renvoi:", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Aucun compte associé à cet email." });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Mot de passe incorrect." });

    if (!user.emailVerified) return res.status(403).json({
      message: "Veuillez vérifier votre email avant de vous connecter.",
      userId: user._id,
      requiresVerification: true
    });

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const ADMIN_EMAIL = "sidhou999@gmail.com";
    const isAdmin = user.isAdmin || user.email === ADMIN_EMAIL;
    const isSuperAdmin = user.email === ADMIN_EMAIL;

    let adminToken = null;
    if (isAdmin) {
      adminToken = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
    }

    res.json({
      message: "Connecté !",
      token,
      adminToken,
      isSuperAdmin: isSuperAdmin || false,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        photo: user.photo,
        isAdmin: isAdmin || false,
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ─── VÉRIFICATION EMAIL (lien token - legacy) ──────────────────────────────────
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

// ─── MOT DE PASSE OUBLIÉ ───────────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: "Si ce compte existe, un email a été envoyé." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30);
    await user.save();

    try {
      await mailjetResetEmail(email, resetToken);
    } catch (emailError) {
      console.log("⚠️ Email reset non envoyé:", emailError.message);
    }

    res.status(200).json({ message: "Si ce compte existe, un email a été envoyé." });
  } catch (err) {
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
