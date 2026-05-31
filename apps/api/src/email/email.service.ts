import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM ?? 'noreply@dzedu.dz',
      to,
      subject: 'Votre code de vérification DzEdu',
      html: this.otpTemplate(otp),
    });
  }

  async sendWelcome(to: string, firstName: string): Promise<void> {
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM ?? 'noreply@dzedu.dz',
      to,
      subject: 'Bienvenue sur DzEdu !',
      html: this.welcomeTemplate(firstName, appUrl),
    });
  }

  private otpTemplate(otp: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563eb;">DzEdu - Vérification</h2>
        <p>Voici votre code de vérification :</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 24px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
          ${otp}
        </div>
        <p style="color: #6b7280; font-size: 14px;">Ce code expire dans 5 minutes.</p>
      </div>`;
  }

  private welcomeTemplate(firstName: string, appUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Bienvenue sur DzEdu !</h2>
        <p>Bonjour ${firstName},</p>
        <p>Votre compte a été vérifié. Connectez-vous pour accéder aux cours.</p>
        <a href="${appUrl}/login" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
          Se connecter
        </a>
      </div>`;
  }
}
