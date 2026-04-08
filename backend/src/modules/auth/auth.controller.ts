import {
  Body,
  Controller,
  Headers,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import {
  ErrorResponseSwaggerDto,
  LoginResponseSwaggerDto,
  LoginSwaggerDto,
  ValidateTokenResponseSwaggerDto,
} from './dto/auth.swagger.dto';
import {
  ForgotPasswordRequestDto,
  forgotPasswordRequestSchema,
  ResetPasswordDto,
  resetPasswordSchema,
  VerifyResetCodeDto,
  verifyResetCodeSchema,
} from './schemas/forgot-password.schema';
import { loginSchema, LoginType } from './schemas/login.schema';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Autenticação de usuário' })
  @ApiBody({ type: LoginSwaggerDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login realizado com sucesso',
    type: LoginResponseSwaggerDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dados inválidos',
    type: ErrorResponseSwaggerDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Dados inválidos',
    type: ErrorResponseSwaggerDto,
  })
  login(@Body(new ZodValidationPipe(loginSchema)) loginDto: LoginType) {
    return this.authService.login(loginDto);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validação de token JWT' })
  @ApiHeader({
    name: 'Authorization',
    description: 'Token JWT no formato Bearer',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token válido',
    type: ValidateTokenResponseSwaggerDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token inválido ou expirado',
    type: ErrorResponseSwaggerDto,
  })
  validateToken(@Headers('Authorization') authHeader: string) {
    if (!authHeader) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    const token = this.extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedException('Invalid Authorization header format');
    }

    return this.authService.validateToken(token);
  }

  private extractTokenFromHeader(authHeader: string): string | null {
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar código de recuperação de senha' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Código enviado para o email',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Email inválido ou código já enviado',
    type: ErrorResponseSwaggerDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Email não encontrado',
    type: ErrorResponseSwaggerDto,
  })
  forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordRequestSchema))
    data: ForgotPasswordRequestDto,
  ) {
    return this.authService.requestPasswordReset(data);
  }

  @Post('verify-reset-code')
  @ApiOperation({ summary: 'Verificar código de reset de senha' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Código verificado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Código inválido',
    type: ErrorResponseSwaggerDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Código expirado',
    type: ErrorResponseSwaggerDto,
  })
  verifyResetCode(
    @Body(new ZodValidationPipe(verifyResetCodeSchema))
    data: VerifyResetCodeDto,
  ) {
    return this.authService.verifyResetCode(data);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Redefinir senha com código de verificação' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Senha redefinida com sucesso',
    type: LoginResponseSwaggerDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Código inválido ou senhas não coincidem',
    type: ErrorResponseSwaggerDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Código expirado',
    type: ErrorResponseSwaggerDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado',
    type: ErrorResponseSwaggerDto,
  })
  resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) data: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(data);
  }

  @Post('resend-reset-code')
  @ApiOperation({ summary: 'Reenviar código de recuperação de senha' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Código reenviado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Solicitação de reset não encontrada ou ainda válida',
    type: ErrorResponseSwaggerDto,
  })
  resendResetCode(
    @Body(new ZodValidationPipe(forgotPasswordRequestSchema))
    data: ForgotPasswordRequestDto,
  ) {
    return this.authService.resendPasswordResetCode(data);
  }
}
