import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtPayload, JwtService } from '../../auth/jwt.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { StepOneDto, StepTwoDto } from '../schemas/create-user.schema';
import {
    RequestEmailChangeDto,
    UpdatePasswordDto,
    UpdateUserBasicInfoDto,
    UpdateUserProfileDto,
    VerifyEmailChangeDto,
} from '../schemas/update-user.schema';
import { UserVerificationService } from './user-verification.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private userVerificationService: UserVerificationService,
  ) {}

  async stepOneRegister(data: StepOneDto) {
    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingPhone = await this.findByPhone(data.phone);
    if (existingPhone) {
      throw new ConflictException('Phone already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
      },
    });

    // Send notification to all admin users
    try {
      const adminUsers = await this.prisma.user.findMany({
        where: { role: Role.ADMIN },
        select: { id: true },
      });
      const adminIds = adminUsers.map((admin) => admin.id);

      if (adminIds.length > 0) {
        await this.notificationsService.notifyMemberRegistration(
          adminIds,
          user.name,
        );
      }
    } catch (error) {
      console.error('Failed to send registration notifications:', error);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    const token = this.jwtService.generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      access_token: token.access_token,
    };
  }

  async stepTwoRegister(
    userId: string,
    data: StepTwoDto,
  ): Promise<{
    user: Omit<User, 'password'>;
    access_token: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.profile) {
      throw new ConflictException('User profile already exists');
    }

    if (data.franchiseeOf && Array.isArray(data.franchiseeOf)) {
      await this.validateFranchises(data.franchiseeOf);
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      await tx.userProfile.create({
        data: {
          userId: userId,
          city: data.city,
          interestSectors: data.interestSectors,
          interestRegion: data.interestRegion,
          investmentRange: data.investmentRange,
        },
      });

      const userWithUpdatedRole = await tx.user.update({
        where: { id: userId },
        data: { role: data.role },
        include: {
          profile: true,
          franchisorProfile: true,
          franchiseeOf: true,
        },
      });

      if (
        data.role === 'FRANCHISEE' &&
        data.franchiseeOf &&
        Array.isArray(data.franchiseeOf) &&
        data.franchiseeOf.length > 0
      ) {
        const franchiseIds = data.franchiseeOf;
        const userWithFranchises = await tx.user.update({
          where: { id: userId },
          data: {
            franchiseeOf: {
              connect: franchiseIds.map((franchiseId: string) => ({
                id: franchiseId,
              })),
            },
          },
          include: {
            profile: true,
            franchisorProfile: true,
            franchiseeOf: true,
          },
        });
        return userWithFranchises;
      }

      return userWithUpdatedRole;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;
    const token = this.jwtService.generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      access_token: token.access_token,
    };
  }

  async updateUserProfile(
    userId: string,
    data: UpdateUserProfileDto,
  ): Promise<{
    roleChanged: boolean;
    updatedUser?: Omit<User, 'password'>;
    access_token?: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, franchiseeOf: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.profile) {
      throw new NotFoundException('User profile not found');
    }

    if (data.franchiseeOf) {
      await this.validateFranchises(data.franchiseeOf);
    }

    const roleChanged = data.role !== undefined && data.role !== user.role;

    const updatedUser = await this.prisma.$transaction(
      async (tx) => {
        // Update profile
        await tx.userProfile.update({
          where: { userId },
          data: {
            ...(data.city !== undefined && { city: data.city }),
            ...(data.interestSectors !== undefined && {
              interestSectors: data.interestSectors,
            }),
            ...(data.interestRegion !== undefined && {
              interestRegion: data.interestRegion,
            }),
            ...(data.investmentRange !== undefined && {
              investmentRange: data.investmentRange,
            }),
          },
        });

        const finalRole = data.role || user.role;

        // Prepare user update data
        const userUpdateData: any = {};

        // Add role if it changed
        if (data.role !== undefined) {
          userUpdateData.role = data.role;
        }

        // Handle franchiseeOf updates
        if (finalRole === Role.FRANCHISEE && data.franchiseeOf !== undefined) {
          // Set franchises - this will replace all existing with new ones
          userUpdateData.franchiseeOf = {
            set: data.franchiseeOf.map((franchiseId) => ({ id: franchiseId })),
          };
        } else if (finalRole !== Role.FRANCHISEE) {
          // Clear franchises for non-franchisee roles
          userUpdateData.franchiseeOf = { set: [] };
        }

        // Perform single user update with all changes
        const updatedUserData = await tx.user.update({
          where: { id: userId },
          data: userUpdateData,
          include: {
            profile: true,
            franchisorProfile: true,
            franchiseeOf: true,
          },
        });

        return updatedUserData;
      },
      {
        timeout: 10000, // Increase timeout to 10 seconds
      },
    );

    if (roleChanged) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = updatedUser;
      const token = this.jwtService.generateToken(userWithoutPassword);

      return {
        roleChanged: true,
        updatedUser: userWithoutPassword,
        access_token: token.access_token,
      };
    }

    return { roleChanged: false };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone },
    });
  }

  async findByCpf(cpf: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { cpf },
    });
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        franchisorProfile: true,
        franchiseeOf: true,
      },
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async findAllUsers(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      include: {
        profile: true,
        franchisorProfile: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return users.map(({ password, ...user }) => user);
  }

  async isProfileComplete(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return false;
    }

    // Check basic info
    const hasBasicInfo = !!(
      user.name &&
      user.email &&
      user.phone &&
      user.cpf
    );

    // Check if user has a valid role (ADMIN is exempt from profile completion)
    const hasValidRole = user.role && user.role !== 'MEMBER';

    // Check profile info
    const hasProfileInfo = !!(
      user.profile &&
      user.profile.city &&
      user.profile.interestSectors &&
      user.profile.interestRegion &&
      user.profile.investmentRange
    );

    return hasBasicInfo && hasValidRole && hasProfileInfo;
  }

  async getProfileCompletionStatus(userId: string): Promise<{
    isComplete: boolean;
    completionPercentage: number;
    missingFields: string[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const missingFields: string[] = [];
    let completedFields = 0;
    // name, email, phone, cpf, role, and 4 profile fields
    const totalFields = 9;

    // Check basic info
    if (user.name) completedFields++;
    else missingFields.push('name');

    if (user.email) completedFields++;
    else missingFields.push('email');

    if (user.phone) completedFields++;
    else missingFields.push('phone');

    if (user.cpf) completedFields++;
    else missingFields.push('cpf');

    // Check role (not MEMBER)
    if (user.role && user.role !== 'MEMBER') {
      completedFields++;
    } else {
      missingFields.push('role');
    }

    // Check profile fields
    if (user.profile) {
      if (user.profile.city) completedFields++;
      else missingFields.push('city');

      if (user.profile.interestSectors) completedFields++;
      else missingFields.push('interestSectors');

      if (user.profile.interestRegion) completedFields++;
      else missingFields.push('interestRegion');

      if (user.profile.investmentRange) completedFields++;
      else missingFields.push('investmentRange');
    } else {
      missingFields.push(
        'city',
        'interestSectors',
        'interestRegion',
        'investmentRange',
      );
    }

    const completionPercentage = Math.round(
      (completedFields / totalFields) * 100,
    );
    const isComplete = missingFields.length === 0;

    return {
      isComplete,
      completionPercentage,
      missingFields,
    };
  }

  async updateUserBasicInfo(
    targetUserId: string,
    data: UpdateUserBasicInfoDto,
    currentUser: JwtPayload,
  ): Promise<Omit<User, 'password'>> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { franchiseeOf: true, profile: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = currentUser.role === Role.ADMIN;
    const isSelf = currentUser.id === targetUserId;

    if (!isAdmin && !isSelf) {
      throw new ForbiddenException('You can only update your own information');
    }

    if (data.phone && data.phone !== existingUser.phone) {
      const phoneExists = await this.findByPhone(data.phone);
      if (phoneExists) {
        throw new ConflictException('Phone already in use');
      }
    }

    if (data.cpf !== undefined && data.cpf !== existingUser.cpf) {
      const cpfExists = await this.findByCpf(data.cpf);
      if (cpfExists) {
        throw new ConflictException('CPF already in use');
      }
    }

    if (data.isActive !== undefined && !isAdmin) {
      throw new ForbiddenException('Only admins can change account status');
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.cpf !== undefined) {
      updateData.cpf = data.cpf;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedUser = await this.prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    if (isAdmin && !isSelf) {
      try {
        await this.emailService.sendUserUpdateNotification({
          userEmail: updatedUser.email,
          userName: updatedUser.name,
        });
      } catch (error) {
        console.error('Failed to send email:', error);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updatedUser;
    return result;
  }

  async requestEmailChange(
    userId: string,
    data: RequestEmailChangeDto,
  ): Promise<{ message: string; expiresAt: Date }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new email is the same as current email
    if (data.newEmail === user.email) {
      throw new BadRequestException(
        'O novo email deve ser diferente do email atual',
      );
    }

    // Check if new email is already in use
    const emailExists = await this.findByEmail(data.newEmail);
    if (emailExists) {
      throw new ConflictException('Este email já está em uso');
    }

    // Create verification code and send email
    return await this.userVerificationService.createEmailChangeVerificationCode(
      userId,
      user.email,
      data.newEmail,
      user.name,
    );
  }

  async verifyAndUpdateEmail(
    userId: string,
    data: VerifyEmailChangeDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify the code and get email change data
    const emailChangeData =
      await this.userVerificationService.verifyEmailChangeCode(
        data.newEmail,
        data.code,
      );

    // Double check the userId matches
    if (emailChangeData.userId !== userId) {
      throw new ForbiddenException('Invalid verification code');
    }

    // Verify the new email matches what was requested
    if (emailChangeData.newEmail !== data.newEmail) {
      throw new BadRequestException('Email does not match verification code');
    }

    // Verify the new email is not already in use (double check)
    const emailExists = await this.findByEmail(emailChangeData.newEmail);
    if (emailExists && emailExists.id !== userId) {
      throw new ConflictException('Este email já está em uso');
    }

    // Update the user's email
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { email: emailChangeData.newEmail },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  async updatePassword(
    userId: string,
    data: UpdatePasswordDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Update password
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  private async validateFranchises(franchiseIds: string[]): Promise<void> {
    if (!franchiseIds || franchiseIds.length === 0) {
      return;
    }

    const existingFranchises = await this.prisma.franchise.findMany({
      where: { id: { in: franchiseIds } },
      select: { id: true, name: true },
    });

    const foundIds = existingFranchises.map((f) => f.id);
    const notFound = franchiseIds.filter((id) => !foundIds.includes(id));

    if (notFound.length > 0) {
      throw new BadRequestException(
        `Franchises with IDs ${notFound.join(', ')} do not exist`,
      );
    }
  }
}
