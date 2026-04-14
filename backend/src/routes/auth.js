import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { User } from "../models/Schemas.js";

const router = express.Router();

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

async function sendVerificationCode(email, code, username) {
  await transporter.sendMail({
    from: `"sellekni" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Code de vérification - sellekni",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%); border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #a855f7; margin-bottom: 10px;">sellekni</h1>
          <div style="width: 50px; height: 4px; background: linear-gradient(90deg, #a855f7, #06b6d4); margin: 0 auto; border-radius: 2px;"></div>
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 16px; padding: 30px;">
          <h2 style="color: white; text-align: center;">Bonjour ${username} !</h2>
          <p style="color: #cbd5e1; text-align: center;">Votre code de vérification :</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: #1e1e2e; padding: 15px 30px; border-radius: 12px; border: 2px solid #a855f7;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #a855f7;">${code}</span>
            </div>
          </div>
          <p style="color: #94a3b8; text-align: center;">Ce code expire dans <strong>10 minutes</strong>.</p>
        </div>
      </div>
    `,
  });
}

// ─── SIGNUP ────────────────────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role, telephone, dateNaissance, wilaya, specialite } = req.body;

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
      await sendVerificationCode(email, verificationCode, username);
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

    res.json({
      message: "Connecté !",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        photo: user.photo
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

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      await transporter.sendMail({
        from: `"sellekni" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Réinitialisation de votre mot de passe — Sellekni",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0f;color:#fff;border-radius:16px;">
            <h1 style="color:#a855f7;">sellekni</h1>
            <h2>Réinitialisation du mot de passe</h2>
            <p>Cliquez sur le lien pour réinitialiser votre mot de passe :</p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;">
              Réinitialiser mon mot de passe
            </a>
            <p style="color:#555;margin-top:28px;font-size:12px;">Ce lien expire dans 30 minutes.</p>
          </div>
        `,
      });
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
