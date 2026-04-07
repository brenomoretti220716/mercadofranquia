import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { JwtGuard } from 'src/modules/auth/guards/jwt.guard';
import { JwtPayload } from 'src/modules/auth/jwt.service';
import {
    ResendVerificationCodeDto,
    StepOneDto,
    StepTwoDto,
    resendVerificationCodeSchema,
    stepOneSchema,
    stepTwoSchema,
} from '../schemas/create-user.schema';
import {
    RequestEmailChangeDto,
    UpdatePasswordDto,
    UpdateUserBasicInfoDto,
    UpdateUserProfileDto,
    VerifyEmailChangeDto,
    requestEmailChangeSchema,
    updatePasswordSchema,
    updateUserBasicInfoSchema,
    updateUserProfileSchema,
    verifyEmailChangeSchema,
} from '../schemas/update-user.schema';
import { MembersService } from '../services/members.service';
import { UserVerificationService } from '../services/user-verification.service';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly membersService: MembersService,
    private readonly userVerificationService: UserVerificationService,
  ) {}

  @Post('members/request-verification')
  @ApiOperation({ summary: 'Request member verification code' })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent successfully',
  })
  async requestMemberVerification(
    @Body(new ZodValidationPipe(stepOneSchema))
    data: StepOneDto,
  ) {
    return await this.membersService.requestVerificationCode(data);
  }

  @Post('members/resend-verification')
  @ApiOperation({ summary: 'Resend member verification code' })
  @ApiResponse({
    status: 200,
    description: 'Verification code resent successfully',
  })
  async resendMemberVerification(
    @Body(new ZodValidationPipe(resendVerificationCodeSchema))
    data: ResendVerificationCodeDto,
  ) {
    return await this.userVerificationService.resendVerificationCode(
      data.email,
    );
  }

  @Post('members/verify-and-create')
  @ApiOperation({ summary: 'Verify code and create member account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { email: { type: 'string' }, code: { type: 'string' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Member created successfully' })
  async verifyAndCreateMember(@Body() data: { email: string; code: string }) {
    return await this.membersService.verifyAndCreate(data.email, data.code);
  }

  @Post('register/step-one')
  @ApiOperation({ summary: 'User registration step one' })
  @ApiResponse({ status: 200, description: 'Step one completed successfully' })
  async stepOneRegister(
    @Body(new ZodValidationPipe(stepOneSchema)) data: StepOneDto,
  ) {
    return this.usersService.stepOneRegister(data);
  }

  @UseGuards(JwtGuard)
  @Post('register/step-two')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User registration step two' })
  @ApiResponse({ status: 200, description: 'Profile completed successfully' })
  async stepTwoRegister(
    @Body(new ZodValidationPipe(stepTwoSchema)) data: StepTwoDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const result = await this.usersService.stepTwoRegister(
      currentUser.id,
      data,
    );
    return {
      message: 'Profile completed successfully',
      user: result.user,
      access_token: result.access_token,
    };
  }

  @UseGuards(JwtGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
  })
  async getMyInfo(@CurrentUser() currentUser: JwtPayload) {
    return await this.usersService.findById(currentUser.id);
  }

  @UseGuards(JwtGuard)
  @Get('me/profile-completion')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile completion status' })
  @ApiResponse({
    status: 200,
    description: 'Profile completion status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isComplete: { type: 'boolean' },
        completionPercentage: { type: 'number' },
        missingFields: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getMyProfileCompletion(@CurrentUser() currentUser: JwtPayload) {
    return await this.usersService.getProfileCompletionStatus(currentUser.id);
  }

  @UseGuards(JwtGuard)
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user basic information' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateMyBasicInfo(
    @Body(new ZodValidationPipe(updateUserBasicInfoSchema))
    data: UpdateUserBasicInfoDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const result = await this.usersService.updateUserBasicInfo(
      currentUser.id,
      data,
      currentUser,
    );
    return { user: result };
  }

  @UseGuards(JwtGuard)
  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Body(new ZodValidationPipe(updateUserProfileSchema))
    data: UpdateUserProfileDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const result = await this.usersService.updateUserProfile(
      currentUser.id,
      data,
    );

    if (result.roleChanged && result.updatedUser && result.access_token) {
      return {
        message: 'Profile updated successfully',
        user: result.updatedUser,
        access_token: result.access_token,
      };
    }

    return { message: 'Profile updated successfully', roleChanged: false };
  }

  @UseGuards(JwtGuard)
  @Post('me/request-email-change')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request email change with verification code' })
  @ApiResponse({
    status: 200,
    description: 'Verification code sent successfully',
  })
  async requestEmailChange(
    @Body(new ZodValidationPipe(requestEmailChangeSchema))
    data: RequestEmailChangeDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    return await this.usersService.requestEmailChange(currentUser.id, data);
  }

  @UseGuards(JwtGuard)
  @Post('me/verify-email-change')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify code and update email' })
  @ApiResponse({ status: 200, description: 'Email updated successfully' })
  async verifyEmailChange(
    @Body(new ZodValidationPipe(verifyEmailChangeSchema))
    data: VerifyEmailChangeDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const result = await this.usersService.verifyAndUpdateEmail(
      currentUser.id,
      data,
    );
    return { message: 'Email atualizado com sucesso', user: result };
  }

  @UseGuards(JwtGuard)
  @Put('me/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  async updatePassword(
    @Body(new ZodValidationPipe(updatePasswordSchema))
    data: UpdatePasswordDto,
    @CurrentUser() currentUser: JwtPayload,
  ) {
    const result = await this.usersService.updatePassword(
      currentUser.id,
      data,
    );
    return { message: 'Senha atualizada com sucesso', user: result };
  }
}
