const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = "kamilfernani9@gmail.com";
const SENDER_NAME = "Sellekni";

const sendEmail = async ({ to, subject, html }) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Brevo error: ${JSON.stringify(err)}`);
  }
};

export const sendVerificationEmail = async (to, token) => {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to,
    subject: "Vérifiez votre adresse email — Sellekni",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0f;color:#fff;border-radius:16px;">
        <h1 style="color:#a855f7;font-size:24px;margin-bottom:8px;">sellekni</h1>
        <p style="color:#aaa;margin-bottom:24px;">La plateforme des techniciens</p>
        <h2 style="font-size:18px;margin-bottom:12px;">Confirmez votre email</h2>
        <p style="color:#ccc;margin-bottom:24px;">Cliquez sur le bouton ci-dessous pour activer votre compte :</p>
        <a href="${url}"
           style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;">
          ✅ Vérifier mon email
        </a>
        <p style="color:#555;margin-top:28px;font-size:12px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
      </div>
    `,
  });
};

export const sendVerificationCodeEmail = async (to, code, username) => {
  await sendEmail({
    to,
    subject: "Code de vérification — Sellekni",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:linear-gradient(135deg,#0a0a0f 0%,#1a1a2e 100%);border-radius:20px;">
        <div style="text-align:center;margin-bottom:30px;">
          <h1 style="color:#a855f7;margin-bottom:10px;">sellekni</h1>
          <div style="width:50px;height:4px;background:linear-gradient(90deg,#a855f7,#06b6d4);margin:0 auto;border-radius:2px;"></div>
        </div>
        <div style="background:rgba(255,255,255,0.05);border-radius:16px;padding:30px;">
          <h2 style="color:white;text-align:center;">Bonjour ${username} !</h2>
          <p style="color:#cbd5e1;text-align:center;">Votre code de vérification :</p>
          <div style="text-align:center;margin:30px 0;">
            <div style="display:inline-block;background:#1e1e2e;padding:15px 30px;border-radius:12px;border:2px solid #a855f7;">
              <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#a855f7;">${code}</span>
            </div>
          </div>
          <p style="color:#94a3b8;text-align:center;">Ce code expire dans <strong>10 minutes</strong>.</p>
        </div>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to, token) => {
  const url = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  await sendEmail({
    to,
    subject: "Réinitialisation de votre mot de passe — Sellekni",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0f;color:#fff;border-radius:16px;">
        <h1 style="color:#a855f7;font-size:24px;margin-bottom:8px;">sellekni</h1>
        <p style="color:#aaa;margin-bottom:24px;">La plateforme des techniciens</p>
        <h2 style="font-size:18px;margin-bottom:12px;">Réinitialisation du mot de passe</h2>
        <p style="color:#ccc;margin-bottom:24px;">Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
        <a href="${url}"
           style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;">
          🔑 Réinitialiser mon mot de passe
        </a>
        <p style="color:#555;margin-top:28px;font-size:12px;">Ce lien expire dans 30 minutes.</p>
        <p style="color:#555;font-size:12px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      </div>
    `,
  });
};
