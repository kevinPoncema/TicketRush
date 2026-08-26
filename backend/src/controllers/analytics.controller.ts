import { Controller, Get, Req, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.entity';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get summary metrics for the tenant dashboard' })
  @Get('summary')
  getSummary(@Req() req: any) {
    return this.analyticsService.getTenantSummary(req.user.tenantId);
  }

  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({ summary: 'Get metrics for a specific event' })
  @Get('events/:id')
  getEventAnalytics(@Param('id') id: string, @Req() req: any) {
    return this.analyticsService.getEventAnalytics(id, req.user.tenantId);
  }
}
