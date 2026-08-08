import { Body, Controller, Param, Post, BadRequestException } from '@nestjs/common';
import { BotsService } from './bots.service';

export interface FillBots {
  count: number
}

@Controller('runs')
export class BotsController {
  constructor(private readonly bots: BotsService) {}

  /** The web app calls this to fund a player with devnet USDC & ATA before creating a party. */
  @Post('faucet')
  async faucet(@Body() body: { pubkey: string }) {
    if (!body?.pubkey) throw new BadRequestException('pubkey required');
    return this.bots.fundUsdc(body.pubkey);
  }

  /** The web app calls this to fill a lobby's empty seats with CPU players. */
  @Post(':code/bots/fill')
  async fill(@Param('code') code: string, @Body() body: FillBots) {
    const count = Math.max(0, Math.min(4, Number(body?.count) || 1))
    const created = await this.bots.fill(code, count)
    this.bots.activate(code, created)
    return { code, bots: created }
  }
}