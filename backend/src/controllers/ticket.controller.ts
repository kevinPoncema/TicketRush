import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketService } from '../services/ticket.service';
import { ValidateTicketDto } from '../dtos/ticket.dto';

@ApiTags('Tickets (Door Scanner)')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a ticket at the door (Scanner)' })
  @Post('validate')
  validate(@Req() req: any, @Body() data: ValidateTicketDto) {
    return this.ticketService.validateTicket(data.ticketId, data.signature, req.user);
  }
}
