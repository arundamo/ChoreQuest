export interface Kid {
  id: string;
  name: string;
  pin: string;
  points: number;
  totalEarned: number;
  role?: 'kid' | 'spouse';
  screenTimeLimitMinutes?: number;
}

export interface Chore {
  id: string;
  name: string;
  points: number;
  assignedTo: string; // Kid's ID
  frequency: 'daily' | 'weekly' | 'one-time';
  createdAt: string;
  isActive: boolean;
}

export interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  quantity: number; // -1 for unlimited
  createdAt: string;
}

export interface PendingChore {
  id: string;
  choreId: string;
  kidId: string;
  choreName: string;
  kidName: string;
  points: number;
  completedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Redemption {
  id: string;
  rewardId: string;
  kidId: string;
  rewardName: string;
  pointsCost: number;
  redeemedAt: string;
  status: 'pending' | 'approved';
}

export interface TvSession {
  id: string;
  kidId: string;
  kidName: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  notes?: string;
  createdAt: string;
}

// AI suggestions responses
export interface AISuggestedChore {
  name: string;
  description: string;
  points: number;
}

export interface AISuggestedReward {
  name: string;
  description: string;
  suggestedPoints: number;
}
