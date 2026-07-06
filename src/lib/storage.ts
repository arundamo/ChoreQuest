import { Kid, Chore, Reward, PendingChore, Redemption } from "../types";

const KEYS = {
  KIDS: "chorequest_kids",
  CHORES: "chorequest_chores",
  REWARDS: "chorequest_rewards",
  PENDING: "chorequest_pending",
  REDEMPTIONS: "chorequest_redemptions",
  PARENT_PIN: "chorequest_parent_pin"
};

// Seed Helper Data
const DEFAULT_KIDS: Kid[] = [
  { id: "k-1", name: "Leo 🦁", pin: "1234", points: 150, totalEarned: 350 },
  { id: "k-2", name: "Emma 🦄", pin: "5678", points: 80, totalEarned: 220 }
];

const DEFAULT_CHORES: Chore[] = [
  { id: "c-1", name: "Make your bed 🛏️", points: 20, assignedTo: "k-2", frequency: "daily", createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), isActive: true },
  { id: "c-2", name: "Clean up toys 🧸", points: 30, assignedTo: "k-1", frequency: "daily", createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), isActive: true },
  { id: "c-3", name: "Feed the family pet 🐾", points: 15, assignedTo: "k-2", frequency: "daily", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), isActive: true },
  { id: "c-4", name: "Take out the recycling ♻️", points: 25, assignedTo: "k-1", frequency: "daily", createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), isActive: true },
  { id: "c-5", name: "Clean your whole room! 🧹", points: 80, assignedTo: "k-1", frequency: "weekly", createdAt: new Date(Date.now() - 86400000 * 4).toISOString(), isActive: true }
];

const DEFAULT_REWARDS: Reward[] = [
  { id: "r-1", name: "30 Min Extra Screen Time 🎮", pointsCost: 50, quantity: -1, createdAt: new Date().toISOString() },
  { id: "r-2", name: "Pick the Friday Family Movie 🍿", pointsCost: 80, quantity: 2, createdAt: new Date().toISOString() },
  { id: "r-3", name: "Visit the Ice Cream Parlor 🍦", pointsCost: 150, quantity: 4, createdAt: new Date().toISOString() },
  { id: "r-4", name: "Bedtime 30 Mins Later (One Night) ⏰", pointsCost: 70, quantity: -1, createdAt: new Date().toISOString() }
];

const DEFAULT_PENDING: PendingChore[] = [
  {
    id: "p-1",
    choreId: "c-1",
    kidId: "k-2",
    choreName: "Make your bed 🛏️",
    kidName: "Emma 🦄",
    points: 20,
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "pending"
  },
  {
    id: "p-h1",
    choreId: "c-2",
    kidId: "k-1",
    choreName: "Clean up toys 🧸",
    kidName: "Leo 🦁",
    points: 30,
    completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: "approved"
  }
];

const DEFAULT_REDEMPTIONS: Redemption[] = [
  {
    id: "red-1",
    rewardId: "r-1",
    kidId: "k-1",
    rewardName: "30 Min Extra Screen Time 🎮",
    pointsCost: 50,
    redeemedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    status: "pending"
  }
];

// LocalStorage helpers with automatic seeding
export const loadData = <T>(key: string, seed: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load localstorage key:", key, e);
    return seed;
  }
};

export const saveData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save localstorage key:", key, e);
  }
};

export const loadKids = (): Kid[] => loadData(KEYS.KIDS, DEFAULT_KIDS);
export const saveKids = (data: Kid[]) => saveData(KEYS.KIDS, data);

export const loadChores = (): Chore[] => loadData(KEYS.CHORES, DEFAULT_CHORES);
export const saveChores = (data: Chore[]) => saveData(KEYS.CHORES, data);

export const loadRewards = (): Reward[] => loadData(KEYS.REWARDS, DEFAULT_REWARDS);
export const saveRewards = (data: Reward[]) => saveData(KEYS.REWARDS, data);

export const loadPending = (): PendingChore[] => loadData(KEYS.PENDING, DEFAULT_PENDING);
export const savePending = (data: PendingChore[]) => saveData(KEYS.PENDING, data);

export const loadRedemptions = (): Redemption[] => loadData(KEYS.REDEMPTIONS, DEFAULT_REDEMPTIONS);
export const saveRedemptions = (data: Redemption[]) => saveData(KEYS.REDEMPTIONS, data);

export const loadParentPin = (): string => {
  try {
    return localStorage.getItem(KEYS.PARENT_PIN) || "0000";
  } catch (e) {
    return "0000";
  }
};

export const saveParentPin = (pin: string): void => {
  try {
    localStorage.setItem(KEYS.PARENT_PIN, pin);
  } catch (e) {
    console.error("Failed to save parent pin:", e);
  }
};
