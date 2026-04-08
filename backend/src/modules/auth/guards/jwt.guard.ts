import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload, JwtService } from '../jwt.service';

interface RequestWithUser extends Request {
  user?: JwtPayload;
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  // eslint-disable-next-line @typescript-eslint/require-await
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    console.log('Authorization header:', request.headers['Authorization']);
    console.log('All headers:', request.headers);

    const token = this.extractTokenFromHeader(request);

    console.log('Extracted token: ', token);

    if (!token) {
      throw new UnauthorizedException('Auth Token is missing');
    }

    const payload = this.jwtService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid Auth Token');
    }

    request['user'] = payload;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers['authorization'] as string | undefined;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
