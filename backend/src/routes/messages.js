import express from "express";
import { Message, Notification, User } from "../models/Schemas.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadMedia, cloudinary } from "../library/cloudinary.js";

const router = express.Router();

/* =========================
   SEND MESSAGE
========================= */
router.post("/message-post", requireAuth, uploadMedia.array("media", 5), async (req, res) => {
  try {
    const sender = req.user.username;
    const receiver = req.body.a || req.body.to || req.body.receiver;
    const message = req.body.message;
    const annonceId = req.body.annonceId;
    const annonceTitre = req.body.annonceTitre;

    if (!receiver) {
      return res.status(400).json({ message: "Receiver manquant" });
    }

    let mediaFiles = [];
    if (req.files?.length > 0) {
      mediaFiles = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith("image") ? "image" :
               file.mimetype.startsWith("video") ? "video" : "audio",
        public_id: file.filename,
        format: file.format || null,
      }));
    }

    const conversationId = [sender, receiver].sort().join("_");
    let conv = await Message.findOne({ conversationId });

    const msgObj = {
      de: sender,
      message: message || "",
      media: mediaFiles,
      createdAt: new Date(),
      lu: false,
    };

    if (conv) {
      conv.reponses.push(msgObj);
      conv.updatedAt = new Date();
      await conv.save();
    } else {
      conv = await Message.create({
        conversationId,
        de: sender,
        a: receiver,
        message: message || "",
        media: mediaFiles,
        annonceId: annonceId || null,
        annonceTitre: annonceTitre || null,
        reponses: [],
        lu: false,
      });
    }

    await Notification.create({
      destinataire: receiver,
      auteur: sender,
      type: "message",
      message: `${sender} vous a envoyé un message`,
    });

    res.status(201).json({
      success: true,
      conversation: conv,
      message: "Message envoyé avec succès",
    });

  } catch (err) {
    console.error("Erreur send message:", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

/* =========================
   GET UNREAD COUNT  (Navbar polling)
   ⚠ DOIT être avant /:username
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
   GET SINGLE CONVERSATION
   ⚠ DOIT être avant /:username
========================= */
router.get("/conversation/:id", requireAuth, async (req, res) => {
  try {
    const conversation = await Message.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }
    res.json(conversation);
  } catch (err) {
    console.error("Erreur get conversation:", err);
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

    // Récupérer les photos de profil pour chaque interlocuteur
    const formatted = await Promise.all(conversations.map(async (conv) => {
      const otherUser = conv.de === req.params.username ? conv.a : conv.de;

      // Chercher l'utilisateur pour obtenir sa photo
      const user = await User.findOne({ username: otherUser });

      let lastMessage = conv.message;
      let lastMessageTime = conv.createdAt;

      if (conv.reponses && conv.reponses.length > 0) {
        const lastReply = conv.reponses[conv.reponses.length - 1];
        lastMessage = lastReply.message || (lastReply.media?.length > 0 ? "📎 Média" : "");
        lastMessageTime = lastReply.createdAt;
      } else if (!lastMessage && conv.media?.length) {
        lastMessage = "📎 Média";
      }

      return {
        ...conv.toObject(),
        otherUser,
        lastMessage,
        lastMessageTime,
        otherUserPhoto: user?.photo || null,
      };
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Erreur get conversations:", err);
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

    let mediaFiles = [];
    if (req.files?.length > 0) {
      mediaFiles = req.files.map(file => ({
        url: file.path,
        type: file.mimetype.startsWith("image") ? "image" :
               file.mimetype.startsWith("video") ? "video" : "audio",
        public_id: file.filename,
        format: file.format || null,
      }));
    }

    const conv = await Message.findById(req.params.id);
    if (!conv) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }

    conv.reponses.push({
      de: sender,
      message: message || "",
      media: mediaFiles,
      createdAt: new Date(),
      lu: false,
    });

    conv.updatedAt = new Date();
    await conv.save();

    const receiver = conv.de === sender ? conv.a : conv.de;
    await Notification.create({
      destinataire: receiver,
      auteur: sender,
      type: "message",
      message: `${sender} vous a répondu`,
    });

    // Retourne le conv brut (compatible Navbar : setSelectedConv(updated))
    res.json(conv);

  } catch (err) {
    console.error("Erreur reply:", err);
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

    if (!conv) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }

    if (conv.de !== username && !conv.lu) {
      conv.lu = true;
    }

    conv.reponses.forEach(reply => {
      if (reply.de !== username && !reply.lu) {
        reply.lu = true;
      }
    });

    await conv.save();
    res.json({ success: true, message: "Messages marqués comme lus" });
  } catch (err) {
    console.error("Erreur mark as read:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* =========================
   MARK MESSAGE AS SEEN (vu)
========================= */
router.post("/:convId/message/:msgIndex/seen", requireAuth, async (req, res) => {
  try {
    const { convId, msgIndex } = req.params;
    const conv = await Message.findById(convId);
    if (!conv) return res.status(404).json({ message: "Conversation non trouvée" });

    if (msgIndex === "main") {
      if (conv.de !== req.user.username) {
        conv.vu = true;
        conv.vuAt = new Date();
      }
    } else {
      const index = parseInt(msgIndex);
      if (!conv.reponses[index]) return res.status(404).json({ message: "Message introuvable" });
      if (conv.reponses[index].de !== req.user.username) {
        conv.reponses[index].vu = true;
        conv.reponses[index].vuAt = new Date();
      }
    }

    await conv.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Erreur mark seen:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* =========================
   DELETE MEDIA
   ⚠ DOIT être avant /:id
========================= */
router.delete("/media/:public_id", requireAuth, async (req, res) => {
  try {
    const result = await cloudinary.uploader.destroy(req.params.public_id);

    if (result.result === "ok") {
      res.json({ success: true, message: "Média supprimé avec succès" });
    } else {
      res.status(404).json({ message: "Média non trouvé" });
    }
  } catch (err) {
    console.error("Erreur delete media:", err);
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
});

/* =========================
   DELETE CONVERSATION
========================= */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const conv = await Message.findById(req.params.id);
    if (!conv) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }

    if (conv.de !== req.user.username && conv.a !== req.user.username)
      return res.status(403).json({ message: "Non autorisé" });

    const allMedia = [
      ...(conv.media || []),
      ...conv.reponses.flatMap(r => r.media || []),
    ];
    for (const media of allMedia) {
      if (media.public_id) {
        await cloudinary.uploader.destroy(media.public_id, {
          resource_type: media.type === "image" ? "image" : "video",
        }).catch(() => {});
      }
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Conversation supprimée" });
  } catch (err) {
    console.error("Erreur delete conversation:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

/* =========================
   DELETE SINGLE MESSAGE
========================= */
router.delete("/:convId/message/:msgIndex", requireAuth, async (req, res) => {
  try {
    const { convId, msgIndex } = req.params;
    const username = req.user.username;

    const conv = await Message.findById(convId);
    if (!conv) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }

    let deletedMedia = [];

    if (msgIndex === "main") {
      if (conv.de !== username)
        return res.status(403).json({ message: "Non autorisé" });

      deletedMedia = conv.media || [];
      conv.message = "";
      conv.media = [];
    } else {
      const index = parseInt(msgIndex);

      if (!conv.reponses[index])
        return res.status(404).json({ message: "Message introuvable" });

      const msg = conv.reponses[index];

      if (msg.de !== username)
        return res.status(403).json({ message: "Non autorisé" });

      deletedMedia = msg.media || [];
      conv.reponses.splice(index, 1);
    }

    for (const media of deletedMedia) {
      if (media.public_id) {
        await cloudinary.uploader.destroy(media.public_id, {
          resource_type: media.type === "image" ? "image" : "video",
        }).catch(() => {});
      }
    }

    await conv.save();
    res.json({ success: true, message: "Message supprimé" });

  } catch (err) {
    console.error("Erreur delete message:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
