import mongoose from "mongoose";

const commentaireSchema = new mongoose.Schema({
  contenu: { type: String, required: true },
  auteur:  { type: String, required: true },
  role:    { type: String },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  username:          { type: String, required: true, unique: true },
  Firstname:         { type: String, default: "" },
  Lastname:          { type: String, default: "" },
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
  lastSeen:               { type: Date, default: null },
  resetPasswordToken:     { type: String, default: null },
  resetPasswordExpires:   { type: Date, default: null },
  verificationCode:       { type: String, default: null },
  verificationCodeExpiry: { type: Date, default: null },
  pwdChangeCode:          { type: String, default: null },
  pwdChangeCodeExpiry:    { type: Date, default: null },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
  isAdmin: { type: Boolean, default: false },
  searchHistory: [
    {
      username: { type: String, required: true },
      photo: { type: String, default: null },
      role: { type: String, default: "client" },
      specialite: { type: String, default: null },
      wilaya: { type: String, default: null },
      moyenne: { type: Number, default: 0 },
      consultedAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

const signalementSchema = new mongoose.Schema({
  par:    { type: String, required: true },
  raison: { type: String, default: "" },
  date:   { type: Date, default: Date.now },
}, { _id: false });

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
  signalements: [signalementSchema],
  deleted:      { type: Boolean, default: false },
  deletedAt:    { type: Date, default: null },
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
  signalements: [signalementSchema],
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  contenu:      { type: String, required: true },
  auteur:       { type: String, required: true },
  role:         { type: String },
  photo:        { type: String, default: null },
  likes:        [{ type: String }],
  commentaires: [commentaireSchema],
  signalements: [signalementSchema],
  deleted:      { type: Boolean, default: false },
  deletedAt:    { type: Date, default: null },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  destinataire: { type: String, required: true },
  type:         { type: String, default: "forum" },
  message:      { type: String, required: true },
  auteur:       { type: String, required: true },
  postId:       { type: String },
  lu:           { type: Boolean, default: false },
}, { timestamps: true });

const mediaSchema = new mongoose.Schema({
  url:       { type: String },
  type:      { type: String, enum: ["image", "video", "audio"] },
  public_id: { type: String },
  format:    { type: String },
}, { _id: false });

const reponseSchema = new mongoose.Schema({
  de:        { type: String },
  message:   { type: String, default: "" },
  media:     { type: [mediaSchema], default: [] },
  lu:        { type: Boolean, default: false },
  vu:        { type: Boolean, default: false },
  vuAt:      { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, index: true },
  annonceId:      { type: String },
  annonceTitre:   { type: String },
  de:             { type: String, required: true },
  a:              { type: String, required: true },
  message:        { type: String, default: "" },
  media:          { type: [mediaSchema], default: [] },
  lu:             { type: Boolean, default: false },
  vu:             { type: Boolean, default: false },
  vuAt:           { type: Date, default: null },
  type:           { type: String, default: "direct_message" },
  reponses:       { type: [reponseSchema], default: [] },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
export const Annonce = mongoose.model("Annonce", annonceSchema);
export const Service = mongoose.model("Service", serviceSchema);
export const Post = mongoose.model("Post", postSchema);
export const Notification = mongoose.model("Notification", notificationSchema);
export const Message = mongoose.model("Message", messageSchema);
