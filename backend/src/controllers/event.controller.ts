import { Controller, Get, Post, Body, Param, Put, Delete, Req, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventService } from '../services/event.service';
import { CreateEventDto, UpdateEventDto } from '../dtos/event.dto';

@ApiTags('Events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event' })
  @Post()
  create(@Req() req: any, @Body() data: CreateEventDto) {
    return this.eventService.createEvent(req.user.tenantId, data);
  }

  @ApiOperation({ summary: 'List all events for a tenant (Public)' })
  @ApiQuery({ name: 'tenantId', required: true })
  @Get()
  findAll(@Query('tenantId') tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId query parameter is required to list events');
    return this.eventService.getEventsByTenant(tenantId);
  }


  @ApiOperation({ summary: 'Get a single event with its ticket tiers (Public)' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.getEventPublic(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an event' })
  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() data: UpdateEventDto) {
    return this.eventService.updateEvent(id, req.user.tenantId, data);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an event' })
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.eventService.deleteEvent(id, req.user.tenantId);
  }
}
