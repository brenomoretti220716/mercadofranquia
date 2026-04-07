import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import {
  EmailConfigType,
  EmailTemplateType,
  UserUpdateNotificationDataType,
} from './schemas/email.schema';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService<EmailConfigType>) {
    this.createTransporter();
  }

  private createTransporter(): void {
    const smtpHost =
      this.configService.get('SMTP_HOST', { infer: true }) ?? 'smtp.gmail.com';
    const smtpPort =
      this.configService.get('SMTP_PORT', { infer: true }) ?? 587;
    const smtpSecure =
      this.configService.get('SMTP_SECURE', { infer: true }) ?? 'false';
    const smtpUser = this.configService.get('SMTP_USER', { infer: true });
    const smtpPass = this.configService.get('SMTP_PASS', { infer: true });

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  private loadTemplate(templateName: string): string {
    try {
      const templatePath = path.join(
        process.cwd(),
        'src/modules/email/templates',
        `${templateName}.hbs`,
      );
      return fs.readFileSync(templatePath, 'utf-8');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Template ${templateName} not found: ${errorMessage}`,
        error,
      );
      throw new Error(`Template ${templateName} not found`);
    }
  }

  private compileTemplate(
    template: string,
    context: Record<string, unknown>,
  ): string {
    const compiledTemplate = handlebars.compile(template);
    return compiledTemplate(context);
  }

  private getLogoPath(): string {
    return path.join(process.cwd(), 'src/assets/logo/MercadoFranquiaBlack.png');
  }

  async sendEmail(emailData: EmailTemplateType): Promise<boolean> {
    try {
      const template = this.loadTemplate(emailData.template);
      const html = this.compileTemplate(template, emailData.context);

      const smtpFrom =
        this.configService.get('SMTP_FROM', { infer: true }) ??
        'noreply@franchise.com';

      const mailOptions = {
        from: smtpFrom,
        to: emailData.to,
        subject: emailData.subject,
        html,
        attachments: [
          {
            filename: 'MercadoFranquiaBlack.png',
            path: this.getLogoPath(),
            cid: 'logo',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send email to ${emailData.to}: ${errorMessage}`,
        error,
      );
      return false;
    }
  }

  async sendUserUpdateNotification(
    data: UserUpdateNotificationDataType,
  ): Promise<boolean> {
    const context = {
      userName: data.userName,
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: data.userEmail,
      subject: 'Atualização de dados cadastrais - Mercado Franquias',
      template: 'user-update-notification',
      context,
    });
  }

  async sendVerificationCode(data: {
    to: string;
    code: string;
    expiresAt: Date;
    userName: string;
  }): Promise<boolean> {
    const context = {
      code: data.code,
      userName: data.userName,
      expiresAt: data.expiresAt.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: data.to,
      subject: 'Código de verificação - Mercado Franquias',
      template: 'review-verification',
      context,
    });
  }

  async sendPasswordResetCode(data: {
    to: string;
    code: string;
    expiresAt: Date;
    userName: string;
  }): Promise<boolean> {
    const context = {
      code: data.code,
      userName: data.userName,
      expiresAt: data.expiresAt.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      currentYear: new Date().getFullYear(),
    };

    return this.sendEmail({
      to: data.to,
      subject: 'Recuperação de senha - Mercado Franquias',
      template: 'password-reset',
      context,
    });
  }
}
