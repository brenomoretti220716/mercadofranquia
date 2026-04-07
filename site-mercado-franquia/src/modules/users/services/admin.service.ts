import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/modules/database/prisma.service';
import { EmailService } from 'src/modules/email/email.service';
import { CreateAdminUserDto } from '../schemas/create-user.schema';
import { UpdateAdminUserDto } from '../schemas/update-user.schema';

interface CurrentUserData {
  id: string;
  name: string;
  role: Role;
  email: string;
}

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(userData: CreateAdminUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const existingPhone = await this.findByPhone(userData.phone);
    if (existingPhone) {
      throw new ConflictException('Phone already exists');
    }

    const existingCpf = await this.findByCpf(userData.cpf);
    if (existingCpf) {
      throw new ConflictException('CPF already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        phone: userData.phone,
        cpf: userData.cpf,
        role: Role.ADMIN,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async update(
    id: string,
    userData: UpdateAdminUserDto,
    currentUser?: CurrentUserData,
  ): Promise<Omit<User, 'password'>> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.findByEmail(userData.email);
      if (emailExists) {
        throw new ConflictException('Email already in use by another user');
      }
    }

    if (userData.phone && userData.phone !== existingUser.phone) {
      const phoneExists = await this.findByPhone(userData.phone);
      if (phoneExists) {
        throw new ConflictException('Phone already in use by another user');
      }
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (userData.name !== undefined) {
      updateData.name = userData.name;
    }

    if (userData.email !== undefined) {
      updateData.email = userData.email;
    }

    if (userData.phone !== undefined) {
      updateData.phone = userData.phone;
    }

    if (userData.isActive !== undefined) {
      updateData.isActive = userData.isActive;
    }

    if (userData.password !== undefined) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    if (currentUser && currentUser.id !== id) {
      try {
        await this.emailService.sendUserUpdateNotification({
          userEmail: user.email,
          userName: user.name,
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
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
    });

    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async findAdmins(): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: [Role.ADMIN] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        cpf: true,
        role: true,
        ownedFranchises: true,
        franchiseeOf: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users;
  }

  async findAdminsPaginated({
    page = 1,
    limit = 10,
    search = '',
  }: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = { role: 'ADMIN' };
    if (search && search.trim()) {
      const lower = search.toLowerCase();
      where.OR = [
        { name: { contains: lower } },
        { email: { contains: lower } },
      ];
    }
    const [data, total, totalActive, totalInactive] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit }),
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { role: 'ADMIN', isActive: true } }),
      this.prisma.user.count({ where: { role: 'ADMIN', isActive: false } }),
    ]);
    return {
      data,
      total,
      totalActive,
      totalInactive,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
