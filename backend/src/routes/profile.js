import express from 'express'
import { User } from "../models/Schemas.js";
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../library/cloudinary.js';

const router = express.Router()

router.post("photo", requireAuth, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Aucune photo" });
    const user = await User.findOneAndUpdate(
      { username: req.user.username },
      { photo: req.file.path },
      { returnDocument: "after" }
    );
    res.json({ message: "Photo mise à jour !", photo: user.photo });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router