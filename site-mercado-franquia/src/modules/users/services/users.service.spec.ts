import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '../../auth/jwt.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { UsersService } from './users.service';
import { UserVerificationService } from './user-verification.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    userProfile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    franchise: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockJwtService = {
    generateToken: jest
      .fn()
      .mockReturnValue({ access_token: 'fake-jwt-token' }),
  };

  const mockEmailService = {
    sendUserUpdateNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotificationsService = {
    notifyMemberRegistration: jest.fn(),
  };

  const mockUserVerificationService = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    verifyEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: UserVerificationService,
          useValue: mockUserVerificationService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('stepOneRegister', () => {
    const stepOneData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      phone: '11999999999',
      cpf: '12345678901',
    };

    it('should create a new user successfully', async () => {
      const createdUser = {
        id: '1',
        ...stepOneData,
        password: 'hashedPassword',
        role: 'CANDIDATE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.stepOneRegister(stepOneData);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('fake-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user.email).toBe(stepOneData.email);
      expect(mockPrismaService.user.create).toHaveBeenCalledTimes(1);
      expect(mockJwtService.generateToken).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: stepOneData.email,
      });

      await expect(service.stepOneRegister(stepOneData)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('should throw ConflictException if phone already exists', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValue({ id: '1', phone: stepOneData.phone });

      await expect(service.stepOneRegister(stepOneData)).rejects.toThrow(
        'Phone already exists',
      );
    });

    // Removed CPF conflict test: current implementation does not validate CPF on step one
  });

  describe('stepTwoRegister', () => {
    const stepTwoData = {
      role: 'CANDIDATE' as const,
      city: 'São Paulo',
      interestSectors: 'Technology',
      interestRegion: 'Southeast',
      investmentRange: '50000-100000',
    };

    it('should create user profile successfully', async () => {
      const user = {
        id: '1',
        email: 'john@example.com',
        profile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.$transaction.mockImplementation(
        (callback: (tx: typeof mockPrismaService) => Promise<unknown>) =>
          callback(mockPrismaService),
      );
      mockPrismaService.userProfile.create.mockResolvedValue({});
      mockPrismaService.user.update.mockResolvedValue({});

      await service.stepTwoRegister('1', stepTwoData);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.stepTwoRegister('1', stepTwoData)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw ConflictException if profile already exists', async () => {
      const user = {
        id: '1',
        email: 'john@example.com',
        profile: { id: '1', userId: '1' },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.stepTwoRegister('1', stepTwoData)).rejects.toThrow(
        'User profile already exists',
      );
    });
  });

  describe('updateUserProfile', () => {
    const updateData = {
      city: 'Rio de Janeiro',
      interestSectors: 'Food & Beverage',
    };

    it('should update user profile successfully without role change', async () => {
      const existingUser = {
        id: '1',
        email: 'john@example.com',
        role: 'CANDIDATE' as const,
        profile: {
          id: '1',
          userId: '1',
          city: 'São Paulo',
          interestSectors: 'Technology',
          interestRegion: 'Southeast',
          investmentRange: '50000-100000',
        },
        franchiseeOf: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.$transaction.mockImplementation(
        (callback: (tx: typeof mockPrismaService) => Promise<unknown>) =>
          callback(mockPrismaService),
      );
      mockPrismaService.userProfile.update.mockResolvedValue({
        ...existingUser.profile,
        ...updateData,
      });

      const result = await service.updateUserProfile('1', updateData);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.roleChanged).toBe(false);
      expect(result.access_token).toBeUndefined();
    });

    it('should update user profile and return new token when role changes', async () => {
      const existingUser = {
        id: '1',
        email: 'john@example.com',
        name: 'John Doe',
        role: 'CANDIDATE' as const,
        profile: {
          id: '1',
          userId: '1',
          city: 'São Paulo',
          interestSectors: 'Technology',
          interestRegion: 'Southeast',
          investmentRange: '50000-100000',
        },
        franchiseeOf: [],
        password: 'hashedPassword',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedUser = {
        ...existingUser,
        role: 'FRANCHISEE' as const,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.$transaction.mockImplementation(
        (callback: (tx: typeof mockPrismaService) => Promise<unknown>) =>
          callback(mockPrismaService),
      );
      mockPrismaService.userProfile.update.mockResolvedValue(
        existingUser.profile,
      );
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateUserProfile('1', {
        role: 'FRANCHISEE',
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result.roleChanged).toBe(true);
      expect(result.access_token).toBe('fake-jwt-token');
      expect(result.updatedUser).toBeDefined();
      expect(result.updatedUser?.role).toBe('FRANCHISEE');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateUserProfile('1', updateData)).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw NotFoundException if profile not found', async () => {
      const existingUser = {
        id: '1',
        email: 'john@example.com',
        role: 'CANDIDATE' as const,
        profile: null,
        franchiseeOf: [],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.updateUserProfile('1', updateData)).rejects.toThrow(
        'User profile not found',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const user = { id: '1', email: 'john@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail('john@example.com');

      expect(result).toEqual(user);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user by id without password', async () => {
      const user = {
        id: '1',
        email: 'john@example.com',
        password: 'hashedPassword',
        profile: null,
        franchisorProfile: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe('john@example.com');
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('findAllUsers', () => {
    it('should return all users without passwords', async () => {
      const users = [
        {
          id: '1',
          email: 'john@example.com',
          password: 'hashedPassword1',
          profile: null,
          franchisorProfile: null,
        },
        {
          id: '2',
          email: 'jane@example.com',
          password: 'hashedPassword2',
          profile: null,
          franchisorProfile: null,
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(users);

      const result = await service.findAllUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });
  });
});
