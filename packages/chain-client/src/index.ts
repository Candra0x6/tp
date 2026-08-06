import { PartyLobby } from '@trust-fall/types';

export class TrustFallChainClient {
  private endpoint: string;

  constructor(endpoint: string = 'https://devnet-router.magicblock.app') {
    this.endpoint = endpoint;
  }

  public async getDelegationStatus(accountPublicKey: string): Promise<{ fqdn: string; isDelegated: boolean }> {
    return {
      fqdn: this.endpoint,
      isDelegated: true,
    };
  }

  public async subscribeRunAccount(runPda: string, callback: (lobby: PartyLobby) => void): Promise<() => void> {
    console.log(`Subscribed to account: ${runPda} at ${this.endpoint}`);
    const unsubscribe = () => console.log(`Unsubscribed from ${runPda}`);
    return unsubscribe;
  }
}
