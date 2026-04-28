import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Params en async pour éviter d'appliquer la transformation aux vidéos/audio
// (Cloudinary rejette width/quality sur les ressources non-image)
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image");
    return {
      folder: "sellekni/messages",
      resource_type: "auto",
      ...(isImage ? { transformation: [{ width: 1200, quality: "auto" }] } : {}),
    };
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/quicktime", "video/webm",
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format non supporté"), false);
  }
};

// Export principal utilisé par messages.js ET les autres routes
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// Alias pour messages.js qui importe uploadMedia
export const uploadMedia = upload;

export { cloudinary };
