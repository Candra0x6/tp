import { Module } from '@nestjs/common';
import { BotsModule } from './bots/bots.module';
import { HealthModule } from './health/health.module';
import { RelayModule } from './relay/relay.module';

@Module({
  imports: [HealthModule, BotsModule, RelayModule],
})
export class AppModule {}