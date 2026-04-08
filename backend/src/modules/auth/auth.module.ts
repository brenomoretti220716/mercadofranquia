import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { PrismaModule } from '../database/prisma.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtService } from './jwt.service';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PrismaModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        const expiresIn = configService.get<string>(
          'JWT_EXPIRES_IN',
        ) as StringValue;

        return {
          secret: secret || 'your-fallback-secret',
          signOptions: {
            expiresIn: expiresIn || '24h',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtService, JwtGuard, RolesGuard],
  exports: [AuthService, JwtService, JwtGuard, RolesGuard],
})
export class AuthModule {}
