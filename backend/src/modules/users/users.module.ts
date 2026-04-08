import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaModule } from '../database/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersAdminController } from './controllers/admin.controller';
import { AdminFranchisorRequestController } from './controllers/admin-franchisor-request.controller';
import { FranchisorRequestController } from './controllers/franchisor-request.controller';
import { UsersController } from './controllers/users.controller';
import { AdminService } from './services/admin.service';
import { MembersService } from './services/members.service';
import { FranchisorsService } from './services/franchisor.service';
import { FranchisorRequestService } from './services/franchisor-request.service';
import { UserVerificationService } from './services/user-verification.service';
import { UsersService } from './services/users.service';

@Module({
  exports: [UsersService],
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    EmailModule,
    NotificationsModule,
  ],
  controllers: [
    UsersController,
    UsersAdminController,
    FranchisorRequestController,
    AdminFranchisorRequestController,
  ],
  providers: [
    UsersService,
    AdminService,
    MembersService,
    FranchisorsService,
    FranchisorRequestService,
    UserVerificationService,
    JwtGuard,
    RolesGuard,
  ],
})
export class UsersModule {}
