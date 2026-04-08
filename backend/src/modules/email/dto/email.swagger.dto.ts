import { ApiProperty } from '@nestjs/swagger';

export class EmailTemplateSwaggerDto {
  @ApiProperty({
    description: 'Email de destino',
    example: 'usuario@exemplo.com',
  })
  to: string;

  @ApiProperty({
    description: 'Assunto do email',
    example: 'Bem-vindo ao Mercado Franquias',
  })
  subject: string;

  @ApiProperty({
    description: 'Nome do template a ser usado',
    example: 'user-update-notification',
  })
  template: string;

  @ApiProperty({
    description: 'Contexto/variáveis para o template',
    example: { userName: 'João Silva', currentYear: 2024 },
    type: Object,
  })
  context: Record<string, unknown>;
}

export class UserUpdateNotificationDataSwaggerDto {
  @ApiProperty({
    description: 'Email do usuário que receberá a notificação',
    example: 'usuario@exemplo.com',
  })
  userEmail: string;

  @ApiProperty({
    description: 'Nome do usuário para personalização do email',
    example: 'João Silva',
  })
  userName: string;
}

export class EmailConfigSwaggerDto {
  @ApiProperty({
    description: 'Host do servidor SMTP',
    example: 'smtp.gmail.com',
  })
  SMTP_HOST: string;

  @ApiProperty({
    description: 'Porta do servidor SMTP',
    example: 587,
  })
  SMTP_PORT: number;

  @ApiProperty({
    description: 'Indica se a conexão SMTP deve ser segura',
    example: 'true',
  })
  SMTP_SECURE: string;

  @ApiProperty({
    description: 'Usuário para autenticação SMTP',
    example: 'usuario@gmail.com',
  })
  SMTP_USER: string;

  @ApiProperty({
    description: 'Senha para autenticação SMTP',
    example: 'senha123',
  })
  SMTP_PASS: string;

  @ApiProperty({
    description: 'Email remetente padrão',
    example: 'noreply@franchise.com',
  })
  SMTP_FROM: string;
}
