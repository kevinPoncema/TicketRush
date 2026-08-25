import { Controller, Get, Post, Body, Param, Put, Delete, Req, Query, BadRequestException } from '@nestjs/common';
import { EventService } from '../services/event.service';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) { }

  @Post()
  create(@Req() req: any, @Body() data: any) {
    return this.eventService.createEvent(req.user.tenantId, data);
  }

  @Get()
  findAll(@Query('tenantId') tenantId: string) {
    if (!tenantId) throw new BadRequestException('tenantId query parameter is required to list events');
    return this.eventService.getEventsByTenant(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.getEventPublic(id);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    return this.eventService.updateEvent(id, req.user.tenantId, data);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.eventService.deleteEvent(id, req.user.tenantId);
  }
}
