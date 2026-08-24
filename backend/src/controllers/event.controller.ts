import { Controller, Get, Post, Body, Param, Put, Delete, Req } from '@nestjs/common';
import { EventService } from '../services/event.service';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  create(@Req() req: any, @Body() data: any) {
    return this.eventService.createEvent(req.user.tenantId, data);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.eventService.getEventsByTenant(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.eventService.getEvent(id, req.user.tenantId);
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
