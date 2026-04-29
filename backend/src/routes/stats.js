import express from "express";
import { User, Annonce, Service } from "../models/Schemas.js";

const router = express.Router();

// GET /api/stats — statistiques publiques de la plateforme
router.get("/", async (req, res) => {
  try {
    const [
      techniciens,
      annonces,
      services,
      wilayasUsers,
      wilayasAnnonces,
      wilayasServices,
      notations,
    ] = await Promise.all([
      User.countDocuments({ role: "technicien" }),
      Annonce.countDocuments({ deleted: { $ne: true } }),
      Service.countDocuments(),
      User.distinct("wilaya", { wilaya: { $nin: ["", null] } }),
      Annonce.distinct("wilaya", { wilaya: { $nin: ["", null] }, deleted: { $ne: true } }),
      Service.distinct("wilaya", { wilaya: { $nin: ["", null] } }),
      User.aggregate([
        { $unwind: "$notations" },
        { $group: { _id: null, avg: { $avg: "$notations.note" } } },
      ]),
    ]);

    // Wilayas uniques toutes sources confondues
    const allWilayas = new Set([...wilayasUsers, ...wilayasAnnonces, ...wilayasServices]);

    // Satisfaction moyenne arrondie
    const avgNote = notations.length > 0 ? notations[0].avg : null;
    const satisfaction = avgNote ? Math.round(avgNote * 20) : null; // note /5 → %

    res.json({
      techniciens,
      annonces: annonces + services,
      wilayas: allWilayas.size,
      satisfaction, // null si pas encore de notations
    });
  } catch (err) {
    console.error("Erreur stats:", err);
    res.status(500).json({ error: "Erreur stats" });
  }
});

export default router;
