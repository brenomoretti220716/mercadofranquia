import {
    BadRequestException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { FranchiseesUserDTO, StepOneDto } from '../schemas/create-user.schema';

@Injectable()
export class UserVerificationService {
  private readonly logger = new Logger(UserVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Gera um código de 6 dígitos numérico
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Calcula a data de expiração (15 minutos a partir de agora)
   */
  private getExpirationDate(): Date {
    const now = new Date();
    return new Date(now.getTime() + 5 * 60 * 1000); // 1 minuto
  }

  private getExpirationTime(expiresAt: Date): number {
    const expirationTime = Math.floor(
      (expiresAt.getTime() - new Date().getTime()) / 60000,
    );
    return expirationTime > 0 ? expirationTime : 1;
  }

  /**
   * Cria um código de verificação e envia por email
   */
  async createVerificationCode(
    email: string,
    userData: StepOneDto,
  ): Promise<{ message: string; expiresAt: Date }> {
    try {
      // Verificar se já existe um código válido para este email e franquia
      const existingVerification = await this.prisma.userVerification.findFirst(
        {
          where: {
            email,
            isUsed: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        },
      );

      if (
        existingVerification?.expiresAt &&
        existingVerification.expiresAt > new Date()
      ) {
        throw new BadRequestException(
          'Um código de verificação já foi enviado para este email. Aguarde alguns minutos antes de solicitar um novo código.',
        );
      }

      const code = this.generateVerificationCode();
      const expiresAt = this.getExpirationDate();

      // Salvar o código de verificação no banco
      await this.prisma.userVerification.create({
        data: {
          email,
          code,
          userData: JSON.stringify(userData),
          expiresAt,
        },
      });

      // Enviar email com o código
      const emailSent = await this.emailService.sendVerificationCode({
        to: email,
        code,
        expiresAt,
        userName: userData.name,
      });

      if (!emailSent) {
        throw new Error('Falha ao enviar email de verificação');
      }

      return {
        message: 'Código de verificação enviado para seu email',
        expiresAt,
      };
    } catch (error) {
      console.error('Error creating verification code:', error);
      throw error;
    }
  }

  async resendVerificationCode(
    email: string,
  ): Promise<{ message: string; expiresAt: Date }> {
    const verification = await this.prisma.userVerification.findFirst({
      where: {
        email,
        isUsed: false,
      },
    });

    if (!verification) {
      throw new BadRequestException('Código de verificação não encontrado');
    }

    if (verification.expiresAt > new Date()) {
      throw new BadRequestException({
        expiresIn: this.getExpirationTime(verification.expiresAt),
        message: `The code will expire in ${this.getExpirationTime(verification.expiresAt)} minute(s)`,
      });
    }

    const code = this.generateVerificationCode();
    const expiresAt = this.getExpirationDate();

    await this.prisma.userVerification.update({
      where: { id: verification.id },
      data: {
        code,
        expiresAt,
      },
    });

    await this.emailService.sendVerificationCode({
      to: email,
      code,
      expiresAt,
      userName: (JSON.parse(verification.userData as string) as StepOneDto)
        .name,
    });

    return {
      message: 'Código de verificação reenviado para seu email',
      expiresAt,
    };
  }

  /**
   * Verifica se o código é válido e retorna os dados do usuário
   */
  async verifyCode(
    email: string,
    code: string,
  ): Promise<FranchiseesUserDTO | null> {
    try {
      // Buscar o código de verificaçã
      const verification = await this.prisma.userVerification.findFirst({
        where: {
          email,
          code,
          isUsed: false,
        },
      });

      if (!verification) {
        throw new BadRequestException('Código de verificação inválido');
      }

      // Verificar se o código não expirou
      if (verification.expiresAt < new Date()) {
        throw new UnauthorizedException('Código de verificação expirado');
      }

      // Marcar o código como usado
      await this.prisma.userVerification.update({
        where: { id: verification.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      const userData = JSON.parse(
        verification.userData as string,
      ) as FranchiseesUserDTO;

      return userData;
    } catch (error) {
      console.error('Error verifying code and creating review:', error);
      throw error;
    }
  }

  /**
   * Cria um código de verificação para mudança de email
   */
  async createEmailChangeVerificationCode(
    userId: string,
    oldEmail: string,
    newEmail: string,
    userName: string,
  ): Promise<{ message: string; expiresAt: Date }> {
    try {
      // Verificar se já existe um código válido para este userId ou newEmail
      const existingVerifications = await this.prisma.userVerification.findMany(
        {
          where: {
            email: newEmail,
            isUsed: false,
            expiresAt: {
              gt: new Date(),
            },
          },
        },
      );

      // Check if any existing verification is for email change with this userId
      const existingEmailChange = existingVerifications.find((v) => {
        try {
          const data = JSON.parse(v.userData as string) as {
            userId?: string;
            type?: string;
          };
          return data.userId === userId && data.type === 'email-change';
        } catch {
          return false;
        }
      });

      if (existingEmailChange) {
        throw new BadRequestException(
          'Um código de verificação já foi enviado para este email. Aguarde alguns minutos antes de solicitar um novo código.',
        );
      }

      const code = this.generateVerificationCode();
      const expiresAt = this.getExpirationDate();

      // Salvar o código de verificação no banco com dados da mudança de email
      const emailChangeData = {
        userId,
        oldEmail,
        newEmail,
        type: 'email-change',
      };

      await this.prisma.userVerification.create({
        data: {
          email: newEmail,
          code,
          userData: JSON.stringify(emailChangeData),
          expiresAt,
        },
      });

      // Enviar email com o código para o novo email
      const emailSent = await this.emailService.sendVerificationCode({
        to: newEmail,
        code,
        expiresAt,
        userName,
      });

      if (!emailSent) {
        throw new Error('Falha ao enviar email de verificação');
      }

      return {
        message: 'Código de verificação enviado para seu novo email',
        expiresAt,
      };
    } catch (error) {
      console.error('Error creating email change verification code:', error);
      throw error;
    }
  }

  /**
   * Verifica o código de mudança de email e retorna os dados
   */
  async verifyEmailChangeCode(
    newEmail: string,
    code: string,
  ): Promise<{ userId: string; oldEmail: string; newEmail: string }> {
    try {
      // Buscar o código de verificação
      const verification = await this.prisma.userVerification.findFirst({
        where: {
          email: newEmail,
          code,
          isUsed: false,
        },
      });

      if (!verification) {
        throw new BadRequestException('Código de verificação inválido');
      }

      // Verificar se o código não expirou
      if (verification.expiresAt < new Date()) {
        throw new UnauthorizedException('Código de verificação expirado');
      }

      // Parse dos dados
      const emailChangeData = JSON.parse(
        verification.userData as string,
      ) as {
        userId: string;
        oldEmail: string;
        newEmail: string;
        type: string;
      };

      if (emailChangeData.type !== 'email-change') {
        throw new BadRequestException('Código de verificação inválido');
      }

      // Marcar o código como usado
      await this.prisma.userVerification.update({
        where: { id: verification.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      return {
        userId: emailChangeData.userId,
        oldEmail: emailChangeData.oldEmail,
        newEmail: emailChangeData.newEmail,
      };
    } catch (error) {
      console.error('Error verifying email change code:', error);
      throw error;
    }
  }

  /**
   * Limpa códigos expirados (pode ser chamado por um cron job)
   */
  async cleanExpiredCodes(): Promise<void> {
    await this.prisma.userVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
