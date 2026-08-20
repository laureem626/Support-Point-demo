import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../services/auth/auth.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'mobile' });
  }

  async validate(mobile: string, password: string): Promise<Partial<User>> {
    const user = await this.authService.validateUser(mobile, password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
