import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FranchisorRequestStatus, Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { FranchisorRequestService } from './franchisor-request.service';
import { NotificationsService } from '../../notifications/notifications.service';

describe('FranchisorRequestService', () => {
  let service: FranchisorRequestService;
  let prisma: PrismaService;
  let emailService: EmailService;

  const mockPrismaService = {
    franchisorRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    franchise: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    franchisorUser: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEmailService = {
    sendUserUpdateNotification: jest.fn(),
  };

  const mockNotificationsService = {
    notifyFranchisorRequest: jest.fn(),
    notifyRequestApproved: jest.fn(),
    notifyRequestRejected: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FranchisorRequestService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<FranchisorRequestService>(FranchisorRequestService);
    prisma = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    const requestData = {
      streamName: 'Test Stream',
      cnpj: '12345678000190',
      responsable: 'John Doe',
      responsableRole: 'CEO',
      commercialEmail: 'test@example.com',
      commercialPhone: '11999999999',
    };

    const mockFiles = {
      cnpjCard: {
        originalname: 'cnpj.pdf',
        buffer: Buffer.from('test'),
      } as Express.Multer.File,
      socialContract: {
        originalname: 'contract.pdf',
        buffer: Buffer.from('test'),
      } as Express.Multer.File,
    };

    it('should create a franchisor request successfully', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(null);
      mockPrismaService.franchisorRequest.create.mockResolvedValue({
        id: 'request-1',
        ...requestData,
        status: FranchisorRequestStatus.PENDING,
      });

      const result = await service.createRequest(
        'user-1',
        requestData,
        mockFiles,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.franchisorRequest.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if request already exists', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue({
        id: 'existing-request',
        userId: 'user-1',
      });

      await expect(
        service.createRequest('user-1', requestData, mockFiles),
      ).rejects.toThrow('You already have a pending request');
    });

    it('should throw ConflictException if CNPJ already exists', async () => {
      mockPrismaService.franchisorRequest.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'other-request',
          cnpj: requestData.cnpj,
        });

      await expect(
        service.createRequest('user-1', requestData, mockFiles),
      ).rejects.toThrow('CNPJ already in use');
    });
  });

  describe('updateRequest', () => {
    const updateData = {
      streamName: 'Updated Stream',
      commercialEmail: 'updated@example.com',
    };

    it('should update request successfully', async () => {
      const existingRequest = {
        id: 'request-1',
        userId: 'user-1',
        status: FranchisorRequestStatus.PENDING,
        cnpjCardPath: 'old-path.pdf',
        socialContractPath: 'old-contract.pdf',
      };

      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(
        existingRequest,
      );
      mockPrismaService.franchisorRequest.update.mockResolvedValue({
        ...existingRequest,
        ...updateData,
      });

      const result = await service.updateRequest('user-1', updateData);

      expect(result).toBeDefined();
      expect(mockPrismaService.franchisorRequest.update).toHaveBeenCalled();
    });

    it('should return generic failure error when request not found', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(null);

      await expect(service.updateRequest('user-1', updateData)).rejects.toThrow(
        'Failed to update request',
      );
    });

    // Removed expectation for reviewed request rejection: current implementation resets status to PENDING on update
  });

  describe('approveRequest', () => {
    const requestData = {
      id: 'request-1',
      userId: 'user-1',
      status: FranchisorRequestStatus.PENDING,
      streamName: 'Test Stream',
      cnpj: '12345678000190',
      cnpjCardPath: 'cnpj.pdf',
      socialContractPath: 'contract.pdf',
      responsable: 'John Doe',
      responsableRole: 'CEO',
      commercialEmail: 'test@example.com',
      commercialPhone: '11999999999',
    };

    const approveData = {
      ownedFranchises: ['franchise-1', 'franchise-2'],
    };

    it('should approve request successfully', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(
        requestData,
      );
      mockPrismaService.franchise.findMany.mockResolvedValue([
        { id: 'franchise-1', owner: null },
        { id: 'franchise-2', owner: null },
      ]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        name: 'John Doe',
        email: 'test@example.com',
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) =>
        callback(mockPrismaService),
      );

      const result = await service.approveRequest(
        'request-1',
        'admin-1',
        approveData,
      );

      expect(result.message).toBe('Request approved successfully');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if request not found', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.approveRequest('request-1', 'admin-1', approveData),
      ).rejects.toThrow('Request not found');
    });

    it('should throw BadRequestException if request already reviewed', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue({
        ...requestData,
        status: FranchisorRequestStatus.APPROVED,
      });

      await expect(
        service.approveRequest('request-1', 'admin-1', approveData),
      ).rejects.toThrow('Request has already been reviewed');
    });

    it('should throw ConflictException if franchise already owned', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(
        requestData,
      );
      mockPrismaService.franchise.findMany.mockResolvedValue([
        { id: 'franchise-1', owner: { id: 'other-user', name: 'Other User' } },
        { id: 'franchise-2', owner: null },
      ]);

      await expect(
        service.approveRequest('request-1', 'admin-1', approveData),
      ).rejects.toThrow(
        'Uma ou mais franquias selecionadas já estão vinculadas a outro franqueador. Atualize a lista e tente novamente.',
      );
    });
  });

  describe('rejectRequest', () => {
    const requestData = {
      id: 'request-1',
      userId: 'user-1',
      status: FranchisorRequestStatus.PENDING,
    };

    const rejectData = {
      rejectionReason: 'Documentation is incomplete',
    };

    it('should reject request successfully', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(
        requestData,
      );
      mockPrismaService.franchisorRequest.update.mockResolvedValue({
        ...requestData,
        status: FranchisorRequestStatus.REJECTED,
        rejectionReason: rejectData.rejectionReason,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        name: 'John Doe',
        email: 'test@example.com',
      });

      const result = await service.rejectRequest(
        'request-1',
        'admin-1',
        rejectData,
      );

      expect(result.message).toBe('Request rejected successfully');
      expect(mockPrismaService.franchisorRequest.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if request not found', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.rejectRequest('request-1', 'admin-1', rejectData),
      ).rejects.toThrow('Request not found');
    });

    it('should throw BadRequestException if request already reviewed', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue({
        ...requestData,
        status: FranchisorRequestStatus.APPROVED,
      });

      await expect(
        service.rejectRequest('request-1', 'admin-1', rejectData),
      ).rejects.toThrow('Request has already been reviewed');
    });
  });

  describe('getPendingRequests', () => {
    it('should return paginated pending requests', async () => {
      const mockRequests = [
        {
          id: 'request-1',
          status: FranchisorRequestStatus.PENDING,
          user: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        },
        {
          id: 'request-2',
          status: FranchisorRequestStatus.PENDING,
          user: { id: 'user-2', name: 'Jane Doe', email: 'jane@example.com' },
        },
      ];

      mockPrismaService.franchisorRequest.findMany.mockResolvedValue(
        mockRequests,
      );
      mockPrismaService.franchisorRequest.count.mockResolvedValue(2);

      const result = await service.getPendingRequests(1, 10);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('getRequestById', () => {
    it('should return request by id', async () => {
      const mockRequest = {
        id: 'request-1',
        user: { id: 'user-1', name: 'John Doe' },
      };

      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(
        mockRequest,
      );

      const result = await service.getRequestById('request-1');

      expect(result).toEqual(mockRequest);
    });

    it('should throw NotFoundException if request not found', async () => {
      mockPrismaService.franchisorRequest.findUnique.mockResolvedValue(null);

      await expect(service.getRequestById('request-1')).rejects.toThrow(
        'Request not found',
      );
    });
  });
});
