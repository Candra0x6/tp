import { Player } from '@trust-fall/types';

export class CpuBotRunner {
  public generateCpuPlayer(idSuffix: number): Player {
    return {
      id: `cpu_${idSuffix}`,
      name: `CPU_${idSuffix}`,
      isCpu: true,
      ready: true,
      stake: 10,
    };
  }

  public decideVote(clueMask: number, doorCount: number): number {
    // Basic CPU voting heuristic based on private clue bitmask
    return clueMask % doorCount;
  }
}
