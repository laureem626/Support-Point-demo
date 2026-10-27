// import { AuthService } from '../../services/auth/auth.service';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RefreshTokenDto } from '../../dtos/refresh-token/refresh-token.dto';
import { Public } from '../../../../common/decorators/is-public-route.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  Body,
  Get,
} from '@nestjs/common';
import { AuthService } from '../../services/auth/auth.service';
@Controller('api/auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Log in with mobile number and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mobile: { type: 'string', example: '255784082951' },
        password: { type: 'string', example: '123456' },
      },
      required: ['mobile', 'password'],
    },
  })
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current user profile' })
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refresh(refreshTokenDto);
  }
}
