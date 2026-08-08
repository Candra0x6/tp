import { Controller, Get, Param, Query } from '@nestjs/common';
import { RelayService } from './relay.service';

@Controller('runs')
export class RelayController {
  constructor(private readonly relay: RelayService) {}

  /** One HTTP call to see the whole board for a run. */
  @Get(':code')
  state(
    @Param('code') code: string,
    @Query('seat') seat: string | undefined,
  ) {
    const seatNum = seat == null || seat === '' ? null : Number(seat)
    return this.relay.state(code, Number.isFinite(seatNum) ? seatNum : null)
  }
}