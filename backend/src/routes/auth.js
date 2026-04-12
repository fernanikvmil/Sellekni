import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dns from "dns/promises";
import { User } from "../models/Schemas.js";
import { sendVerificationEmail } from "../library/mailer.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, role, telephone, dateNaissance, wilaya, specialite } = req.body;

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

    // validation for username
    if (!username || username.trim().length < 3)
      return res.status(400).json({ message: "Le nom d'utilisateur doit contenir au moins 3 caractères." })

    // check if username is taken
    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) return res.status(400).json({ message: "Ce nom d'utilisateur est déjà pris." });

    // check if email is taken
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email déjà utilisé" });

    // check password strength
    const pwdRegex = /^(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!pwdRegex.test(password)) return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères, une majuscule et un caractère spécial." });

    // hash password and create user
    const hashed = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // create user and save it into db
    await User.create({ username, email, password: hashed, role, verificationToken, emailVerified: false, telephone: telephone || "", dateNaissance: dateNaissance || "", wilaya: wilaya || "", specialite: specialite || "" });

    // Envoi email (non bloquant)
    sendVerificationEmail(email, verificationToken)
      .catch(err => console.error("Erreur envoi email:", err.message));

    res.status(201).json({ message: "Compte créé ! Vérifiez votre email pour l'activer." });
  } catch (err) {
    console.error("Erreur signup :", err.message);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if email exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Aucun compte associé à cet email." });

    // password validation
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Mot de passe incorrect." });
    if (!user.emailVerified) return res.status(403).json({ message: "Veuillez vérifier votre email avant de vous connecter." });

    // token generation
    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Connecté !", token, user: { username: user.username, email: user.email, role: user.role, photo: user.photo } });

  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    // token verification
    if (!token) return res.status(400).json({ message: "Token manquant." });
    const user = await User.findOneAndUpdate(
      { verificationToken: token, emailVerified: false },
      { emailVerified: true, verificationToken: null },
      { returnDocument: "after" }
    );

    if (!user) return res.status(400).json({ message: "Token invalide ou déjà utilisé." });

    res.json({ message: "Email vérifié avec succès !" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});


export default router