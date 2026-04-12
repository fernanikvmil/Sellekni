import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (to, token) => {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from: "Sellekni <onboarding@resend.dev>",
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
        <p style="color:#555;font-size:12px;">Ce lien expire dans 24h.</p>
      </div>
    `,
  });
};
