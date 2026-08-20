import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenDto } from '../../dtos/refresh-token/refresh-token.dto';
import { User } from '../../../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials (mobile & password).
   * @param mobile - The user's mobile number.
   * @param password - The user's password.
   * @returns Partial user data if valid, otherwise throws an error.
   */
  async validateUser(mobile: string, password: string): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({
      where: { mobile },
      select: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        mobile: true,
        isActive: true,
        createdAt: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      uuid: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  /**
   * Log in a user and generate authentication tokens.
   * Handles verification, 2FA, and token generation.
   *
   * @param user - The validated user data.
   * @returns An object containing the user data, access token, and refresh token (or OTP message if 2FA is enabled).
   */
  async login(user: Partial<User>) {
    // const payload = { mobile: user.mobile, sub: user.uuid, id: user.id };
    // OR Use this for getting authenticated user's profile with full details
    const payload = {
      id: user.id,
      uuid: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      isActive: user.isActive,
    };

    // Generate the access token
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token (With longer expiration time)
    const refreshToken = this.generateRefreshToken(payload);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate a refresh token with a longer expiration period.
   * @param payload - The token payload (user data).
   * @returns A signed refresh token.
   */
  private generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      expiresIn: '14d',
      secret: process.env.JWT_REFRESH_SECRET_KEY,
    });
  }

  /**
   * Refresh authentication tokens using a valid refresh token.
   * @param refreshTokenDto - DTO containing the refresh token.
   * @returns New access and refresh tokens if valid, otherwise throws an error.
   */
  async refresh(refreshTokenDto: RefreshTokenDto) {
    try {
      const { refreshToken } = refreshTokenDto;

      // Verify the submitted refresh token
      const verifiedPayload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET_KEY,
      });

      // Generate new access token
      const payload = {
        mobile: verifiedPayload.mobile,
        sub: verifiedPayload.sub,
        id: verifiedPayload.id,
      };
      const newAccessToken = this.jwtService.sign(payload);

      // Regenerate the existing refresh token
      const regeneratedRefreshToken = this.generateRefreshToken(payload);

      return {
        accessToken: newAccessToken,
        refreshToken: regeneratedRefreshToken,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Refresh token expired. Please log in again.',
        );
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid refresh token.');
      } else {
        throw new InternalServerErrorException(
          'An error occurred while verifying the token.',
        );
      }
    }
  }
}
