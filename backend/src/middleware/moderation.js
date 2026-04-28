// backend/middleware/moderation.js
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SIGHTENGINE_API_USER = process.env.SIGHTENGINE_API_USER || '';
const SIGHTENGINE_API_SECRET = process.env.SIGHTENGINE_API_SECRET || '';

export async function moderateImageWithSightEngine(imageUrl) {
  if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
    console.warn('⚠️ SightEngine non configuré');
    return { safe: true };
  }

  try {
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    });

    const formData = new FormData();
    formData.append('media', Buffer.from(imageResponse.data), {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('models', 'nudity-2.0,wad');

    const response = await axios.post(
      `https://api.sightengine.com/1.0/check.json?api_user=${SIGHTENGINE_API_USER}&api_secret=${SIGHTENGINE_API_SECRET}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    const data = response.data;

    console.log('📊 Scores SightEngine:', {
      nudity_raw: data.nudity?.raw,
      nudity_partial: data.nudity?.partial,
      nudity_suggestive: data.nudity?.suggestive,
      weapon: data.weapon,
      drugs: data.drugs,
    });

    const isNudity = (data.nudity?.raw || 0) > 0.6;
    const isPartialNudity = (data.nudity?.partial || 0) > 0.6;
    const isSuggestive = (data.nudity?.suggestive || 0) > 0.7;
    const hasWeapon = (data.weapon || 0) > 0.5;
    const hasDrugs = (data.drugs || 0) > 0.4;

    return {
      safe: !(isNudity || isPartialNudity || isSuggestive || hasWeapon || hasDrugs),
      details: {
        nudity: isNudity,
        partial_nudity: isPartialNudity,
        suggestive: isSuggestive,
        weapon: hasWeapon,
        drugs: hasDrugs
      },
      scores: data
    };
  } catch (err) {
    console.error('Erreur SightEngine:', err.response?.data || err.message);
    return { safe: true };
  }
}

export async function moderateImage(req, res, next) {
  if (!req.file) return next();

  try {
    const imageUrl = req.file.secure_url || req.file.path;
    console.log('🔍 Vérification image...');

    const result = await moderateImageWithSightEngine(imageUrl);

    if (!result.safe) {
      const violations = [];
      if (result.details.nudity) violations.push("nudité explicite");
      if (result.details.partial_nudity) violations.push("nudité partielle");
      if (result.details.suggestive) violations.push("contenu suggestif");
      if (result.details.weapon) violations.push("arme");
      if (result.details.drugs) violations.push("drogue");

      console.log('❌ IMAGE REFUSÉE:', violations);

      return res.status(403).json({
        message: `❌ Image refusée: ${violations.join(', ')}`,
        violations
      });
    }

    console.log('✅ IMAGE ACCEPTÉE');
    req.moderationResult = result;
    next();
  } catch (err) {
    console.error('Erreur modération:', err);
    next();
  }
}
