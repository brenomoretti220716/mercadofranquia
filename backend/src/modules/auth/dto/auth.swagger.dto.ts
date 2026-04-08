import { ApiProperty } from '@nestjs/swagger';

export class LoginSwaggerDto {
  @ApiProperty({
    description: 'Email do usuário para login',
    example: 'admin@franchise.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha123',
    minLength: 1,
  })
  password: string;
}

export class LoginResponseSwaggerDto {
  @ApiProperty({
    description: 'Dados do usuário autenticado',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@franchise.com',
      name: 'João Silva',
      role: 'ADMIN',
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };

  @ApiProperty({
    description: 'Token JWT para autenticação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}

export class ValidateTokenResponseSwaggerDto {
  @ApiProperty({
    description: 'Indica se o token é válido',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'Dados do usuário do token',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@franchise.com',
      name: 'João Silva',
      role: 'ADMIN',
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };

  @ApiProperty({
    description: 'Mensagem de confirmação',
    example: 'Token is valid',
  })
  message: string;
}

export class ErrorResponseSwaggerDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: 401,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Dados inválidos',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Unauthorized',
  })
  error: string;
}
