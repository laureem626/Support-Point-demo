import { Controller, Get,UseGuards, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
@Controller('api/dashboard')
@ApiTags('Dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard summary stats' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully.',
  })
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }
}