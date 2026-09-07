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
   * Validate user credentials.
   */
  async validateUser(
    mobile: string,
    password: string,
  ): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({
      where: {
        mobile,
      },

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

      relations: {
        designations: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    const passwordValid = await bcrypt.compare(
      password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid credentials',
      );
    }

    return {
      id: user.id,
      uuid: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,
      isActive: user.isActive,
      createdAt: user.createdAt,

      // Keep the designation relation available
      designations: user.designations,
    };
  }

  /**
   * Log in user and generate authentication tokens.
   */
  async login(user: Partial<User>) {
    const payload = {
      id: user.id,
      uuid: user.uuid,
      firstName: user.firstName,
      lastName: user.lastName,
      mobile: user.mobile,

      // Get the actual designation value.
      //
      // Example:
      // "SUPPORTER"
      // "BA"
      // "DEVS"
      // "QA"
      designation: user.designations,

      isActive: user.isActive,
    };

    const accessToken =
      this.jwtService.sign(payload);

    const refreshToken =
      this.generateRefreshToken(payload);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate refresh token.
   */
  private generateRefreshToken(
    payload: any,
  ): string {
    return this.jwtService.sign(payload, {
      expiresIn: '14d',
      secret:
        process.env.JWT_REFRESH_SECRET_KEY,
    });
  }

  /**
   * Refresh authentication tokens.
   */
  async refresh(
    refreshTokenDto: RefreshTokenDto,
  ) {
    try {
      const { refreshToken } =
        refreshTokenDto;

      const verifiedPayload =
        this.jwtService.verify(refreshToken, {
          secret:
            process.env.JWT_REFRESH_SECRET_KEY,
        });

      const payload = {
        id: verifiedPayload.id,
        uuid: verifiedPayload.uuid,
        firstName:
          verifiedPayload.firstName,
        lastName:
          verifiedPayload.lastName,
        mobile: verifiedPayload.mobile,

        // Keep designation as a single value
        designation:
          verifiedPayload.designation,

        isActive:
          verifiedPayload.isActive,
      };

      const newAccessToken =
        this.jwtService.sign(payload);

      const regeneratedRefreshToken =
        this.generateRefreshToken(payload);

      return {
        accessToken: newAccessToken,
        refreshToken:
          regeneratedRefreshToken,
      };
    } catch (error) {
      if (
        error?.name ===
        'TokenExpiredError'
      ) {
        throw new UnauthorizedException(
          'Refresh token expired. Please log in again.',
        );
      }

      if (
        error?.name ===
        'JsonWebTokenError'
      ) {
        throw new UnauthorizedException(
          'Invalid refresh token.',
        );
      }

      throw new InternalServerErrorException(
        'An error occurred while verifying the token.',
      );
    }
  }
}