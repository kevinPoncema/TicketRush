import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { TicketTierService } from '../services/ticket-tier.service';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.entity';

@Controller('ticket-tiers')
export class TicketTierController {
  constructor(private readonly tierService: TicketTierService) {}

  @Get('event/:eventId')
  getByEvent(@Param('eventId') eventId: string) {
    return this.tierService.getTiersByEvent(eventId);
  }

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Req() req: any, @Body() data: any) {
    return this.tierService.createTier(req.user, data);
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.tierService.updateTier(req.user, id, data);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tierService.deleteTier(req.user, id);
  }
}
