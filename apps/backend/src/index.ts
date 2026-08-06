import { healthCheckHandler } from './routes/health';
import { CpuBotRunner } from './services/bot';
import { TrustFallChainClient } from '@trust-fall/chain-client';

console.log('Starting Trust Fall Backend Service...');

const chainClient = new TrustFallChainClient();
const botRunner = new CpuBotRunner();

console.log('Health:', healthCheckHandler());
console.log('Sample Bot:', botRunner.generateCpuPlayer(1));

async function main() {
  const status = await chainClient.getDelegationStatus('test_account');
  console.log('Chain Delegation Status:', status);
}

main().catch(console.error);
