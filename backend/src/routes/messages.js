import express from 'express';
import { Message, Notification } from '../models/Schemas.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// POST - Envoyer un message (crée ou met à jour une conversation)
router.post("/message-post", requireAuth, async (req, res) => {
  try {
    const { annonceId, annonceTitre, de, a, message, type } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message vide" });
    }

    // ID de conversation unique basé sur les deux utilisateurs (triés alphabétiquement)
    const conversationId = [de, a].sort().join('_');

    // Chercher une conversation existante
    let conversation = await Message.findOne({ conversationId });

    if (conversation) {
      // Conversation existante → ajouter comme réponse
      conversation.reponses.push({
        de: de,
        message: message.trim(),
        lu: false,
        createdAt: new Date(),
      });
      conversation.updatedAt = new Date();
      await conversation.save();
    } else {
      // Nouvelle conversation
      conversation = await Message.create({
        conversationId,
        annonceId: annonceId || conversationId,
        annonceTitre: annonceTitre || "Message direct",
        de,
        a,
        message: message.trim(),
        reponses: [],
        lu: false,
        type: type || 'direct_message',
      });
    }

    // Notification au destinataire
    await Notification.create({
      destinataire: a,
      type: "message",
      auteur: de,
      message: `${de} vous a envoyé un message`,
    });

    res.status(201).json({ success: true, message: "Message envoyé !", msg: conversation });
  } catch (err) {
    console.error('Erreur message-post:', err);
    res.status(500).json({ success: false, message: "Erreur serveur", error: err.message });
  }
});

// GET - Nombre de messages non lus
router.get("/:username/unread", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const conversations = await Message.find({
      $or: [{ a: req.params.username }, { de: req.params.username }],
    });

    let unreadCount = 0;
    conversations.forEach(conv => {
      if (conv.a === req.params.username && !conv.lu) unreadCount++;
      conv.reponses.forEach(rep => {
        if (rep.de !== req.params.username && !rep.lu) unreadCount++;
      });
    });

    res.json({ count: unreadCount });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// GET - Toutes les conversations d'un utilisateur
router.get("/:username", requireAuth, async (req, res) => {
  try {
    if (req.user.username !== req.params.username) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    const conversations = await Message.find({
      $or: [{ a: req.params.username }, { de: req.params.username }],
    }).sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// POST - Répondre à une conversation
router.post("/:id/reponse", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: "Message vide" });
    }

    const conversation = await Message.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    if (conversation.a !== req.user.username && conversation.de !== req.user.username) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    conversation.reponses.push({
      de: req.user.username,
      message: message.trim(),
      lu: false,
      createdAt: new Date(),
    });
    conversation.updatedAt = new Date();

    // Marquer comme lu si le destinataire répond
    if (conversation.a === req.user.username && !conversation.lu) {
      conversation.lu = true;
    }

    await conversation.save();

    // Notifier l'autre partie
    const recipient = conversation.a === req.user.username ? conversation.de : conversation.a;
    await Notification.create({
      destinataire: recipient,
      type: "message",
      auteur: req.user.username,
      message: `${req.user.username} a répondu`,
    });

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// PATCH - Marquer une conversation comme lue
router.patch("/:id/lu", requireAuth, async (req, res) => {
  try {
    const conversation = await Message.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    if (conversation.a !== req.user.username) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    conversation.lu = true;
    conversation.reponses.forEach(rep => {
      if (rep.de !== req.user.username && !rep.lu) rep.lu = true;
    });

    await conversation.save();
    res.json({ message: "Conversation marquée comme lue" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

// DELETE - Supprimer une conversation
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const conversation = await Message.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    if (conversation.a !== req.user.username && conversation.de !== req.user.username) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    await conversation.deleteOne();
    res.json({ message: "Conversation supprimée" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
});

export default router;
