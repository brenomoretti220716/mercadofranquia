import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { UsersService } from '../users/services/users.service';
import { JwtService } from './jwt.service';
import {
  ForgotPasswordRequestDto,
  ResetPasswordDto,
  VerifyResetCodeDto,
} from './schemas/forgot-password.schema';
import { LoginType } from './schemas/login.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async login(loginDto: LoginType) {
    const existingUser = await this.usersService.findByEmail(loginDto.email);

    if (!existingUser) {
      throw new NotFoundException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      throw new NotFoundException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = existingUser;
    const token = this.jwtService.generateToken(user);

    return {
      user: {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
      },
      access_token: token.access_token,
    };
  }

  validateToken(token: string) {
    const payload = this.jwtService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    return {
      valid: true,
      payload: payload,
      message: 'Token is valid',
    };
  }

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
    return new Date(now.getTime() + 15 * 60 * 1000); // 15 minutos
  }

  /**
   * Solicita reset de senha enviando código por email
   */
  async requestPasswordReset(
    data: ForgotPasswordRequestDto,
  ): Promise<{ message: string; expiresAt: Date }> {
    // Verificar se o usuário existe
    const existingUser = await this.usersService.findByEmail(data.email);

    if (!existingUser) {
      // Por segurança, não revelamos se o email existe ou não
      // Mas retornamos sucesso para evitar enumeration attacks
      throw new NotFoundException(
        'Se este e-mail estiver cadastrado, você receberá um código de verificação.',
      );
    }

    // Verificar se já existe um código válido
    const existingVerification = await this.prisma.userVerification.findFirst({
      where: {
        email: data.email,
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingVerification) {
      const expirationTime = Math.floor(
        (existingVerification.expiresAt.getTime() - new Date().getTime()) /
          60000,
      );
      throw new BadRequestException({
        expiresIn: expirationTime > 0 ? expirationTime : 1,
        message: `Um código já foi enviado. Aguarde ${expirationTime > 0 ? expirationTime : 1} minuto(s) antes de solicitar um novo código.`,
      });
    }

    const code = this.generateVerificationCode();
    const expiresAt = this.getExpirationDate();

    // Salvar o código de verificação no banco com tipo password_reset
    await this.prisma.userVerification.create({
      data: {
        email: data.email,
        code,
        userData: JSON.stringify({ type: 'password_reset' }),
        expiresAt,
      },
    });

    // Enviar email com o código
    const emailSent = await this.emailService.sendPasswordResetCode({
      to: data.email,
      code,
      expiresAt,
      userName: existingUser.name,
    });

    if (!emailSent) {
      throw new Error('Falha ao enviar email de recuperação de senha');
    }

    return {
      message: 'Código de verificação enviado para seu email',
      expiresAt,
    };
  }

  /**
   * Verifica se o código de reset é válido
   */
  async verifyResetCode(
    data: VerifyResetCodeDto,
  ): Promise<{ message: string }> {
    const verification = await this.prisma.userVerification.findFirst({
      where: {
        email: data.email,
        code: data.code,
        isUsed: false,
      },
    });

    if (!verification) {
      throw new BadRequestException('Código inválido ou já utilizado');
    }

    if (verification.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Código expirado. Solicite um novo código.',
      );
    }

    return {
      message: 'Código verificado com sucesso',
    };
  }

  /**
   * Reseta a senha do usuário após verificação do código
   */
  async resetPassword(data: ResetPasswordDto): Promise<{
    message: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    access_token: string;
  }> {
    // Verificar o código novamente
    const verification = await this.prisma.userVerification.findFirst({
      where: {
        email: data.email,
        code: data.code,
        isUsed: false,
      },
    });

    if (!verification) {
      throw new BadRequestException('Código inválido ou já utilizado');
    }

    if (verification.expiresAt < new Date()) {
      throw new UnauthorizedException(
        'Código expirado. Solicite um novo código.',
      );
    }

    // Buscar o usuário
    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Atualizar a senha do usuário
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Marcar o código como usado
    await this.prisma.userVerification.update({
      where: { id: verification.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
      },
    });

    // Gerar token para auto-login
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    const token = this.jwtService.generateToken(userWithoutPassword);

    return {
      message: 'Senha redefinida com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      access_token: token.access_token,
    };
  }

  /**
   * Reenvia código de reset de senha
   */
  async resendPasswordResetCode(
    data: ForgotPasswordRequestDto,
  ): Promise<{ message: string; expiresAt: Date }> {
    const verification = await this.prisma.userVerification.findFirst({
      where: {
        email: data.email,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      throw new BadRequestException('Nenhuma solicitação de reset encontrada');
    }

    // Se ainda está válido, não permitir reenvio
    if (verification.expiresAt > new Date()) {
      const expirationTime = Math.floor(
        (verification.expiresAt.getTime() - new Date().getTime()) / 60000,
      );
      throw new BadRequestException({
        expiresIn: expirationTime > 0 ? expirationTime : 1,
        message: `Aguarde ${expirationTime > 0 ? expirationTime : 1} minuto(s) antes de solicitar um novo código.`,
      });
    }

    const user = await this.usersService.findByEmail(data.email);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const code = this.generateVerificationCode();
    const expiresAt = this.getExpirationDate();

    // Atualizar o código existente
    await this.prisma.userVerification.update({
      where: { id: verification.id },
      data: {
        code,
        expiresAt,
      },
    });

    // Enviar novo email
    await this.emailService.sendPasswordResetCode({
      to: data.email,
      code,
      expiresAt,
      userName: user.name,
    });

    return {
      message: 'Código reenviado com sucesso',
      expiresAt,
    };
  }
}
