export interface EmailTemplate {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export interface UserUpdateNotificationData {
  userEmail: string;
  userName: string;
}

export interface EmailConfig {
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
}
