import mongoose from "mongoose";

const commentaireSchema = new mongoose.Schema({
  contenu: { type: String, required: true },
  auteur:  { type: String, required: true },
  role:    { type: String },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  username:          { type: String, required: true, unique: true },
  email:             { type: String, required: true, unique: true },
  password:          { type: String, required: true },
  role:              { type: String, enum: ["client", "technicien"], default: "client" },
  photo:             { type: String, default: null },
  emailVerified:     { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  bio:               { type: String, default: "" },
  telephone:         { type: String, default: "" },
  dateNaissance:     { type: String, default: "" },
  specialite:        { type: String, default: "" },
  wilaya:            { type: String, default: "" },
  ville:             { type: String, default: "" },
  notations:         [{ auteur: String, note: Number }],
  lastSeen:          { type: Date, default: null },
}, { timestamps: true });

const annonceSchema = new mongoose.Schema({
  titre:        { type: String, required: true },
  description:  { type: String, required: true },
  prix:         { type: Number, required: true },
  categorie:    { type: String, required: true },
  auteur:       { type: String, required: true },
  role:         { type: String },
  photo:        { type: String, default: null },
  wilaya:       { type: String, default: "" },
  commentaires: [commentaireSchema],
}, { timestamps: true });

const serviceSchema = new mongoose.Schema({
  titre:        { type: String, required: true },
  description:  { type: String, required: true },
  prix:         { type: Number, required: true },
  categorie:    { type: String, required: true },
  auteur:       { type: String, required: true },
  role:         { type: String },
  photo:        { type: String, default: null },
  wilaya:       { type: String, default: "" },
  commentaires: [commentaireSchema],
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  contenu:      { type: String, required: true },
  auteur:       { type: String, required: true },
  role:         { type: String },
  photo:        { type: String, default: null },
  likes:        [{ type: String }],
  commentaires: [commentaireSchema],
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  destinataire: { type: String, required: true },
  type:         { type: String, default: "forum" },
  message:      { type: String, required: true },
  auteur:       { type: String, required: true },
  postId:       { type: String },
  lu:           { type: Boolean, default: false },
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, index: true },
  annonceId:      { type: String },
  annonceTitre:   { type: String },
  de:             { type: String, required: true },
  a:              { type: String, required: true },
  message:        { type: String, required: true },
  lu:             { type: Boolean, default: false },
  type:           { type: String, default: "direct_message" },
  reponses:       [{
    de:        String,
    message:   String,
    lu:        { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export const Annonce = mongoose.model("Annonce", annonceSchema);
export const Service = mongoose.model("Service", serviceSchema);
export const Post = mongoose.model("Post", postSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const Message = mongoose.model("Message", messageSchema);