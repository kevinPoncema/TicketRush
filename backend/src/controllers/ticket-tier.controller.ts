import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketTierService } from '../services/ticket-tier.service';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.entity';
import { CreateTicketTierDto, UpdateTicketTierDto } from '../dtos/ticket-tier.dto';

@ApiTags('Ticket Tiers')
@Controller('ticket-tiers')
export class TicketTierController {
  constructor(private readonly tierService: TicketTierService) {}

  @ApiOperation({ summary: 'Get all ticket tiers for an event (Public)' })
  @Get('event/:eventId')
  getByEvent(@Param('eventId') eventId: string) {
    return this.tierService.getTiersByEvent(eventId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new ticket tier (Admin only)' })
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Req() req: any, @Body() data: CreateTicketTierDto) {
    return this.tierService.createTier(req.user, data);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a ticket tier (Admin only)' })
  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() data: UpdateTicketTierDto) {
    return this.tierService.updateTier(req.user, id, data);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a ticket tier (Admin only)' })
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.tierService.deleteTier(req.user, id);
  }
}
