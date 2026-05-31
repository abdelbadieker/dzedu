import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@dzedu.dz',
    to: email,
    subject: 'Votre code de vérification DzEdu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563eb;">DzEdu - Vérification</h2>
        <p>Voici votre code de vérification :</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          Ce code expire dans 5 minutes. Ne le partagez avec personne.
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
          Si vous n'avez pas demandé ce code, ignorez cet email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} DzEdu - Plateforme Éducative Algérienne
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? 'noreply@dzedu.dz',
    to: email,
    subject: 'Bienvenue sur DzEdu !',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bienvenue sur DzEdu !</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre compte a été vérifié avec succès. Vous pouvez maintenant accéder à tous nos cours.</p>
        <a href="${appUrl}/login" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          Se connecter
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          &copy; ${new Date().getFullYear()} DzEdu - Plateforme Éducative Algérienne
        </p>
      </div>
    `,
  });
}
