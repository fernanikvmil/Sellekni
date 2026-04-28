import express from "express";
import { Message, Notification } from "../models/Schemas.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadMedia, cloudinary } from "../library/cloudinary.js";

const router = express.Router();

/* =========================
   SEND MESSAGE
========================= */
router.post("/message-post", requireAuth, uploadMedia.array("media", 5), async (req, res) => {
  try {
    const sender      = req.user.username;
    const receiver    = req.body.a || req.body.to || req.body.receiver;
    const message     = req.body.message;
    const annonceId   = req.body.annonceId;
    const annonceTitre = req.body.annonceTitre;

    if (!receiver) {
      return res.status(400).json({ message: "Receiver manquant" });
    }

    const mediaFiles = (req.files || []).map(file => ({
      url:       file.path,
      type:      file.mimetype.startsWith("image") ? "image"
                 : file.mimetype.startsWith("video") ? "video" : "audio",
      public_id: file.filename,
      format:    file.format || null,
    }));

    const conversationId = [sender, receiver].sort().join("_");
    let conv = await Message.findOne({ conversationId });

    const msgObj = {
      de:        sender,
      message:   message || "",
      media:     mediaFiles,
      createdAt: new Date(),
      lu:        false,
    };

    if (conv) {
      conv.reponses.push(msgObj);
      conv.updatedAt = new Date();
      await conv.save();
    } else {
      conv = await Message.create({
        conversationId,
        de:          sender,
        a:           receiver,
        message:     message || "",
        media:       mediaFiles,
        annonceId:   annonceId   || null,
        annonceTitre:annonceTitre || null,
        reponses:    [],
        lu:          false,
      });
    }

    await Notification.create({
      destinataire: receiver,
      auteur:       sender,
      type:         "message",
      message:      `${sender} vous a envoyé un message`,
    });

    res.status(201).json({ success: true, conversation: conv, message: "Message envoyé !" });
  } catch (err) {
    console.error("Erreur send message:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

/* =========================
   GET UNREAD COUNT  (Navbar polling)
========================= */
router.get("/:username/unread", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });

    const conversations = await Message.find({
      $or: [{ a: req.params.username }, { de: req.params.username }],
    });

    let count = 0;
    conversations.forEach(conv => {
      if (conv.a === req.params.username && !conv.lu) count++;
      conv.reponses.forEach(r => {
        if (r.de !== req.params.username && !r.lu) count++;
      });
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* =========================
   GET SINGLE CONVERSATION  — doit être AVANT /:username
========================= */
router.get("/conversation/:id", requireAuth, async (req, res) => {
  try {
    const conv = await Message.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation non trouvée" });
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* =========================
   GET ALL CONVERSATIONS
========================= */
router.get("/:username", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username)
      return res.status(403).json({ message: "Non autorisé" });

    const conversations = await Message.find({
      $or: [{ a: req.params.username }, { de: req.params.username }],
    }).sort({ updatedAt: -1 });

    const formatted = conversations.map(conv => {
      const otherUser = conv.de === req.params.username ? conv.a : conv.de;

      let lastMessage = conv.message;
      let lastMessageTime = conv.createdAt;

      if (conv.reponses?.length > 0) {
        const last = conv.reponses[conv.reponses.length - 1];
        lastMessage     = last.message || (last.media?.length ? "📎 Média" : "");
        lastMessageTime = last.createdAt;
      } else if (!lastMessage && conv.media?.length) {
        lastMessage = "📎 Média";
      }

      return { ...conv.toObject(), otherUser, lastMessage, lastMessageTime };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* =========================
   REPLY TO MESSAGE
========================= */
router.post("/:id/reponse", requireAuth, uploadMedia.array("media", 5), async (req, res) => {
  try {
    const sender = req.user.username;
    const { message } = req.body;

    const mediaFiles = (req.files || []).map(file => ({
      url:       file.path,
      type:      file.mimetype.startsWith("image") ? "image"
                 : file.mimetype.startsWith("video") ? "video" : "audio",
      public_id: file.filename,
      format:    file.format || null,
    }));

    const conv = await Message.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation non trouvée" });

    conv.reponses.push({
      de:        sender,
      message:   message || "",
      media:     mediaFiles,
      createdAt: new Date(),
      lu:        false,
    });

    conv.updatedAt = new Date();
    await conv.save();

    const receiver = conv.de === sender ? conv.a : conv.de;
    await Notification.create({
      destinataire: receiver,
      auteur:       sender,
      type:         "message",
      message:      `${sender} vous a répondu`,
    });

    // Retourne la conversation directement (compatible Navbar)
    res.json(conv);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* =========================
   MARK AS READ
========================= */
router.patch("/:id/lu", requireAuth, async (req, res) => {
  try {
    const username = req.user.username;
    const conv = await Message.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation non trouvée" });

    if (conv.de !== username && !conv.lu) conv.lu = true;

    conv.reponses.forEach(r => {
      if (r.de !== username && !r.lu) r.lu = true;
    });

    await conv.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* =========================
   DELETE MEDIA  — doit être AVANT /:id
========================= */
router.delete("/media/:public_id", requireAuth, async (req, res) => {
  try {
    const result = await cloudinary.uploader.destroy(req.params.public_id);
    if (result.result === "ok")
      return res.json({ success: true });
    res.status(404).json({ message: "Média non trouvé" });
  } catch (err) {
    res.status(500).json({ message: "Erreur suppression média" });
  }
});

/* =========================
   DELETE CONVERSATION
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const conv = await Message.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation non trouvée" });

    if (conv.de !== req.user.username && conv.a !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });

    // Nettoyer les médias Cloudinary
    const allMedia = [
      ...(conv.media || []),
      ...conv.reponses.flatMap(r => r.media || []),
    ];
    for (const m of allMedia) {
      if (m.public_id) {
        await cloudinary.uploader.destroy(m.public_id, {
          resource_type: m.type === "image" ? "image" : "video",
        }).catch(() => {});
      }
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
