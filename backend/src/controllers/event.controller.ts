import { Controller, Get, Post, Body, Param, Put, Delete, Req } from '@nestjs/common';
import { EventService } from '../services/event.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) { }

  @Post()
  create(@Req() req: any, @Body() data: any) {
    const tenantId = req.user.tenantId;
    return this.eventService.createEvent(tenantId, data);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.eventService.getEventsByTenant(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.getEvent(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.eventService.updateEvent(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventService.deleteEvent(id);
  }
}
