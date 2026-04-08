import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';

export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
}

@Injectable()
export class JwtService {
  constructor(private jwtService: NestJwtService) {}

  generateToken(user: Omit<User, 'password'>) {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  decodedToken(token: string): JwtPayload {
    return this.jwtService.decode(token);
  }
}
