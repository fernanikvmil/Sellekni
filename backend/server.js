import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from './src/library/mongoose.js'

// routes
import authRoutes from "./src/routes/auth.js";
import annoncesRoutes from "./src/routes/annonces.js"
import userRoutes from './src/routes/users.js'
import serviceRoutes from './src/routes/services.js'
import forumRoutes from './src/routes/forum.js'
import notificationRoutes from './src/routes/notifications.js'
import messagesRoutes from './src/routes/messages.js'


const PORT = process.env.PORT || 5000;
const app = express();  
const allowedOrigins = [
    (process.env.FRONTEND_URL || "").trim(),
    "https://sellekni-kappa.vercel.app",
    "http://localhost:5173"
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin.trim())) {
            callback(null, true);
        } else {
            callback(null, true); // allow all for now
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
}))
app.use(express.json());

app.use("/health-check", (req, res) => {
    res.status(200).json({ message: "Server is healthy!" });
})

app.get("/api/test", (req, res) => {
    res.status(200).json({ message: "Backend OK" });
})

app.use("/api/auth", authRoutes);
app.use("/api", authRoutes); // alias: /api/login, /api/signup, /api/verify-email
app.use("/api/users", userRoutes);
app.use("/api/annonces", annoncesRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/posts", forumRoutes); // alias pour le frontend
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messagesRoutes)


connectDB()
const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
server.on("error", (err) => console.error("Erreur serveur :", err));