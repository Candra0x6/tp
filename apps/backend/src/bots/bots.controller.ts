import { Body, Controller, Param, Post } from '@nestjs/common';
import { BotsService } from './bots.service';

export interface FillBots {
  count: number
}

@Controller('runs/:code/bots')
export class BotsController {
  constructor(private readonly bots: BotsService) {}

  /** The web app calls this to fill a lobby's empty seats with CPU players. */
  @Post('fill')
  async fill(@Param('code') code: string, @Body() body: FillBots) {
    const count = Math.max(0, Math.min(4, Number(body?.count) || 1))
    const created = await this.bots.fill(code, count)
    this.bots.activate(code, created)
    return { code, bots: created }
  }
}