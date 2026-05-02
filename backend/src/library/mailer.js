const EMAILJS_SERVICE_ID  = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY  = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

// Envoi du code de vérification via EmailJS
export const sendVerificationCodeEmail = async (to, code, username) => {
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString("fr-FR");

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:    EMAILJS_SERVICE_ID,
      template_id:   EMAILJS_TEMPLATE_ID,
      user_id:       EMAILJS_PUBLIC_KEY,
      accessToken:   EMAILJS_PRIVATE_KEY,
      template_params: {
        email:    to,
        passcode: code,
        time:     expiryTime,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`EmailJS error: ${err}`);
  }
};

// Reset mot de passe (gardé pour compatibilité)
export const sendPasswordResetEmail = async (to, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:    EMAILJS_SERVICE_ID,
      template_id:   EMAILJS_TEMPLATE_ID,
      user_id:       EMAILJS_PUBLIC_KEY,
      accessToken:   EMAILJS_PRIVATE_KEY,
      template_params: {
        email:    to,
        passcode: url,
        time:     "30 minutes",
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`EmailJS error: ${err}`);
  }
};

// Legacy (non utilisé)
export const sendVerificationEmail = async (to, token) => {
  await sendPasswordResetEmail(to, token);
};
