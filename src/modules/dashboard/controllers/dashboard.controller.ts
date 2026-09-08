import { Controller, Get,UseGuards, } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { DashboardResponseDto } from '../dtos/dashboard-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
@ApiTags('Dashboard')

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard summary stats' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully.',
    type: DashboardResponseDto,
  })
  async getDashboard(): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboardStats();
  }
}