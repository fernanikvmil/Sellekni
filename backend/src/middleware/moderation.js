// backend/middleware/moderation.js
import axios from 'axios';
import FormData from 'form-data';

const SIGHTENGINE_API_USER = process.env.SIGHTENGINE_API_USER || '';
const SIGHTENGINE_API_SECRET = process.env.SIGHTENGINE_API_SECRET || '';

/* ── Scoring partagé ─────────────────────────────────────── */
function scoreResult(data) {
  const isNudity      = (data.nudity?.raw      || 0) > 0.6;
  const isPartialNud  = (data.nudity?.partial   || 0) > 0.6;
  const isSuggestive  = (data.nudity?.suggestive|| 0) > 0.7;
  const hasWeapon     = (data.weapon            || 0) > 0.5;
  const hasDrugs      = (data.drugs             || 0) > 0.4;
  const isOffensive   = (data.offensive?.prob   || 0) > 0.7;
  const isGore        = (data.gore?.prob         || 0) > 0.7;

  return {
    safe: !(isNudity || isPartialNud || isSuggestive || hasWeapon || hasDrugs || isOffensive || isGore),
    details: {
      nudity:         isNudity,
      partial_nudity: isPartialNud,
      suggestive:     isSuggestive,
      weapon:         hasWeapon,
      drugs:          hasDrugs,
      offensive:      isOffensive,
      gore:           isGore,
    },
  };
}

/* ── Vérification via buffer (pour check-image sans Cloudinary) ── */
export async function moderateImageBuffer(buffer, mimetype = 'image/jpeg') {
  if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
    console.warn('⚠️ SightEngine non configuré');
    return { safe: true };
  }

  try {
    const formData = new FormData();
    formData.append('media', buffer, {
      filename: 'image.jpg',
      contentType: mimetype,
    });
    formData.append('models', 'nudity-2.0,wad,offensive,gore');
    formData.append('api_user', SIGHTENGINE_API_USER);
    formData.append('api_secret', SIGHTENGINE_API_SECRET);

    const response = await axios.post(
      'https://api.sightengine.com/1.0/check.json',
      formData,
      { headers: formData.getHeaders(), timeout: 30000 }
    );

    console.log('📊 SightEngine (buffer):', response.data?.nudity, response.data?.weapon, response.data?.drugs);
    return scoreResult(response.data);
  } catch (err) {
    console.error('Erreur SightEngine (buffer):', err.response?.data || err.message);
    return { safe: true };
  }
}

/* ── Vérification via URL Cloudinary (utilisée après upload) ── */
export async function moderateImageWithSightEngine(imageUrl) {
  if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
    console.warn('⚠️ SightEngine non configuré');
    return { safe: true };
  }

  try {
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
    return moderateImageBuffer(Buffer.from(imageResponse.data), 'image/jpeg');
  } catch (err) {
    console.error('Erreur SightEngine (url):', err.response?.data || err.message);
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
