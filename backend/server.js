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
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}))
app.use(express.json());

app.use("/health-check", (req, res) => {
    res.status(200).json({ message: "Server is healthy!" });
})

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/annonces", annoncesRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messagesRoutes)


connectDB()
const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
server.on("error", (err) => console.error("Erreur serveur :", err));