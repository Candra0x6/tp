export interface Player {
  id: string;
  name: string;
  isCpu: boolean;
  ready: boolean;
  stake: number;
}

export interface PartyLobby {
  id: string;
  hostId: string;
  players: Player[];
  status: 'lobby' | 'active' | 'completed' | 'failed';
  currentFloor: number;
  maxFloors: number;
  potBalance: number;
}

export interface CluePayload {
  floor: number;
  playerId: string;
  mask: number;
  clueText: string;
  verifiedOnChain: boolean;
}

export interface VoteDecision {
  playerId: string;
  doorIndex: number;
  timestamp: number;
}
