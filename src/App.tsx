import React, { useState, useEffect, useRef } from "react";
import { Kid, Chore, Reward, PendingChore, Redemption, TvSession } from "./types";
import { 
  loadKids, saveKids, 
  loadChores, saveChores, 
  loadRewards, saveRewards, 
  loadPending, savePending, 
  loadRedemptions, saveRedemptions,
  loadParentPin, saveParentPin,
  loadTvSessions, saveTvSessions
} from "./lib/storage";
import LoginScreen from "./components/LoginScreen";
import ParentDashboard from "./components/ParentDashboard";
import KidDashboard from "./components/KidDashboard";
import { motion, AnimatePresence } from "motion/react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }
  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          sanitized[key] = sanitizeForFirestore(val);
        }
      }
    }
    return sanitized;
  }
  return obj;
}

export default function App() {
  // Application Roles State
  const [currentUser, setCurrentUser] = useState<{ role: "parent" | "kid"; data?: Kid } | null>(null);

  // Core database tables states
  const [kids, setKids] = useState<Kid[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pending, setPending] = useState<PendingChore[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [parentPin, setParentPin] = useState<string>("0000");
  const [tvSessions, setTvSessions] = useState<TvSession[]>([]);

  const lastServerStateRef = useRef<string>("");

  // 1. Live, Real-time Subscription to Firestore Document
  useEffect(() => {
    const docPath = "family-data/chorequest";
    const docRef = doc(db, "family-data", "chorequest");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      try {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const serverStateObj = {
            kids: data.kids || [],
            chores: data.chores || [],
            rewards: data.rewards || [],
            pending: data.pending || [],
            redemptions: data.redemptions || [],
            parentPin: data.parentPin || "0000",
            tvSessions: data.tvSessions || []
          };
          const serverStateStr = JSON.stringify(serverStateObj);

          if (serverStateStr !== lastServerStateRef.current) {
            setKids(serverStateObj.kids);
            setChores(serverStateObj.chores);
            setRewards(serverStateObj.rewards);
            setPending(serverStateObj.pending);
            setRedemptions(serverStateObj.redemptions);
            setParentPin(serverStateObj.parentPin);
            setTvSessions(serverStateObj.tvSessions);

            saveKids(serverStateObj.kids);
            saveChores(serverStateObj.chores);
            saveRewards(serverStateObj.rewards);
            savePending(serverStateObj.pending);
            saveRedemptions(serverStateObj.redemptions);
            saveParentPin(serverStateObj.parentPin);
            saveTvSessions(serverStateObj.tvSessions);

            lastServerStateRef.current = serverStateStr;
          }
        } else {
          // Document doesn't exist yet (first-time initialization)
          const localKids = loadKids();
          const localChores = loadChores();
          const localRewards = loadRewards();
          const localPending = loadPending();
          const localRedemptions = loadRedemptions();
          const localParentPin = loadParentPin();
          const localTvSessions = loadTvSessions();

          setKids(localKids);
          setChores(localChores);
          setRewards(localRewards);
          setPending(localPending);
          setRedemptions(localRedemptions);
          setParentPin(localParentPin);
          setTvSessions(localTvSessions);

          const localStateObj = {
            kids: localKids,
            chores: localChores,
            rewards: localRewards,
            pending: localPending,
            redemptions: localRedemptions,
            parentPin: localParentPin,
            tvSessions: localTvSessions,
            initialized: true
          };
          lastServerStateRef.current = JSON.stringify({
            kids: localKids,
            chores: localChores,
            rewards: localRewards,
            pending: localPending,
            redemptions: localRedemptions,
            parentPin: localParentPin,
            tvSessions: localTvSessions
          });

          setDoc(docRef, sanitizeForFirestore(localStateObj)).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, docPath);
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, docPath);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
    });

    return () => unsubscribe();
  }, []);

  // Update active kid session if currentUser is a kid
  useEffect(() => {
    if (currentUser && currentUser.role === "kid" && currentUser.data) {
      const match = kids.find(k => k.id === currentUser.data?.id);
      if (match) {
        setCurrentUser(prev => prev ? { ...prev, data: match } : null);
      }
    }
  }, [kids]);

  // 2. Automatically save state back to Firestore when changed by user interaction
  useEffect(() => {
    if (kids.length === 0 && chores.length === 0 && rewards.length === 0 && pending.length === 0 && redemptions.length === 0 && tvSessions.length === 0) {
      return;
    }

    const currentState = { kids, chores, rewards, pending, redemptions, parentPin, tvSessions };
    const currentStateStr = JSON.stringify(currentState);

    if (currentStateStr !== lastServerStateRef.current) {
      lastServerStateRef.current = currentStateStr;

      const docPath = "family-data/chorequest";
      const docRef = doc(db, "family-data", "chorequest");
      setDoc(docRef, sanitizeForFirestore({ ...currentState, initialized: true }))
        .catch(err => {
          handleFirestoreError(err, OperationType.WRITE, docPath);
        });
    }
  }, [kids, chores, rewards, pending, redemptions, parentPin, tvSessions]);

  // Update central kid data accessor when logging in
  const updateActiveKidSessionData = (updatedKids: Kid[]) => {
    if (currentUser && currentUser.role === "kid" && currentUser.data) {
      const match = updatedKids.find(k => k.id === currentUser.data?.id);
      if (match) {
        setCurrentUser({ role: "kid", data: match });
      }
    }
  };

  // 1. ADD, UPDATE & DELETE KIDS
  const handleAddKid = (name: string, pin: string, role: "kid" | "spouse" = "kid", screenTimeLimitMinutes?: number) => {
    const newKid: Kid = {
      id: `kid-${Date.now()}`,
      name,
      pin,
      points: 0,
      totalEarned: 0,
      role,
      screenTimeLimitMinutes: role === "spouse" ? undefined : (screenTimeLimitMinutes ?? 60)
    };
    const updated = [...kids, newKid];
    setKids(updated);
    saveKids(updated);
  };

  const handleUpdateKid = (id: string, name: string, pin: string, points: number, role: "kid" | "spouse" = "kid", screenTimeLimitMinutes?: number) => {
    const updated = kids.map(k => {
      if (k.id === id) {
        return {
          ...k,
          name,
          pin,
          points,
          totalEarned: Math.max(k.totalEarned, points),
          role,
          screenTimeLimitMinutes: role === "spouse" ? undefined : (screenTimeLimitMinutes ?? k.screenTimeLimitMinutes ?? 60)
        };
      }
      return k;
    });
    setKids(updated);
    saveKids(updated);
    updateActiveKidSessionData(updated);
  };

  const handleDeleteKid = (id: string) => {
    const updated = kids.filter(k => k.id !== id);
    setKids(updated);
    saveKids(updated);
    
    // Clear selected log history if it matches the deleted kid
    if (currentUser && currentUser.role === "kid" && currentUser.data?.id === id) {
      setCurrentUser(null);
    }
  };

  // 2. ADD, UPDATE & DELETE CHORES
  const handleAddChore = (choreData: Omit<Chore, "id" | "createdAt" | "isActive">) => {
    const newChore: Chore = {
      ...choreData,
      id: `chore-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    const updated = [...chores, newChore];
    setChores(updated);
    saveChores(updated);
  };

  const handleUpdateChore = (id: string, updatedData: Partial<Chore>) => {
    const updated = chores.map(c => {
      if (c.id === id) {
        return {
          ...c,
          ...updatedData
        };
      }
      return c;
    });
    setChores(updated);
    saveChores(updated);
  };

  const handleDeleteChore = (id: string) => {
    // Soft delete / filter out
    const updated = chores.filter(c => c.id !== id);
    setChores(updated);
    saveChores(updated);
  };

  // 3. ADD & DELETE REWARDS
  const handleAddReward = (rewardData: Omit<Reward, "id" | "createdAt">) => {
    const newReward: Reward = {
      ...rewardData,
      id: `reward-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...rewards, newReward];
    setRewards(updated);
    saveRewards(updated);
  };

  const handleDeleteReward = (id: string) => {
    const updated = rewards.filter(r => r.id !== id);
    setRewards(updated);
    saveRewards(updated);
  };

  // 4. CHORE COMPLETIONS (KID MARKS DONE)
  const handleCompleteChore = (choreId: string) => {
    if (!currentUser || currentUser.role !== "kid" || !currentUser.data) return;
    const targetKid = currentUser.data;
    const targetChore = chores.find(c => c.id === choreId);
    if (!targetChore) return;

    // Check if ya already have a pending registration
    const alreadyPending = pending.some(p => p.choreId === choreId && p.kidId === targetKid.id && p.status === "pending");
    if (alreadyPending) return;

    const newPending: PendingChore = {
      id: `pending-${Date.now()}`,
      choreId: targetChore.id,
      kidId: targetKid.id,
      choreName: targetChore.name,
      kidName: targetKid.name,
      points: targetChore.points,
      completedAt: new Date().toISOString(),
      status: "pending"
    };

    const updatedPending = [...pending, newPending];
    setPending(updatedPending);
    savePending(updatedPending);
  };

  // 5. APPROVE CHORE COMPLETION
  const handleApproveChore = (pendingId: string) => {
    const pItemIdx = pending.findIndex(p => p.id === pendingId);
    if (pItemIdx === -1) return;

    const updatedPending = [...pending];
    const item = { ...updatedPending[pItemIdx], status: "approved" as const };
    updatedPending[pItemIdx] = item;

    // Credit Points wallet to Kid
    const updatedKids = kids.map(k => {
      if (k.id === item.kidId) {
        return {
          ...k,
          points: k.points + item.points,
          totalEarned: k.totalEarned + item.points
        };
      }
      return k;
    });

    setPending(updatedPending);
    savePending(updatedPending);
    setKids(updatedKids);
    saveKids(updatedKids);
    updateActiveKidSessionData(updatedKids);
  };

  // 6. REJECT CHORE COMPLETION
  const handleRejectChore = (pendingId: string) => {
    const updatedPending = pending.map(p => {
      if (p.id === pendingId) {
        return { ...p, status: "rejected" as const };
      }
      return p;
    });

    setPending(updatedPending);
    savePending(updatedPending);
  };

  // 7. REDEEM REWARD STORE CLAIM (KID BUYS)
  const handleRedeemReward = async (reward: Reward) => {
    if (!currentUser || currentUser.role !== "kid" || !currentUser.data) return;
    const targetKid = currentUser.data;

    if (targetKid.points < reward.pointsCost) return;

    // Decrement inventory if limited
    let updatedRewards = [...rewards];
    if (reward.quantity !== -1) {
      updatedRewards = rewards.map(r => {
        if (r.id === reward.id) {
          return { ...r, quantity: Math.max(0, r.quantity - 1) };
        }
        return r;
      });
      setRewards(updatedRewards);
      saveRewards(updatedRewards);
    }

    // Deduct star points instantly from wallet
    const updatedKids = kids.map(k => {
      if (k.id === targetKid.id) {
        return { ...k, points: Math.max(0, k.points - reward.pointsCost) };
      }
      return k;
    });

    // Create redemption request pending approval
    const newRedemption: Redemption = {
      id: `redemp-${Date.now()}`,
      rewardId: reward.id,
      kidId: targetKid.id,
      rewardName: reward.name,
      pointsCost: reward.pointsCost,
      redeemedAt: new Date().toISOString(),
      status: "pending"
    };

    const updatedRedemptions = [...redemptions, newRedemption];

    setKids(updatedKids);
    saveKids(updatedKids);
    setRedemptions(updatedRedemptions);
    saveRedemptions(updatedRedemptions);
    updateActiveKidSessionData(updatedKids);
  };

  // 8. APPROVE REWARD REDEMPTION (PARENT HANDS OUT PRIZE)
  const handleApproveRedemption = (redemptionId: string) => {
    const updated = redemptions.map(r => {
      if (r.id === redemptionId) {
        return { ...r, status: "approved" as const };
      }
      return r;
    });
    setRedemptions(updated);
    saveRedemptions(updated);
  };

  // 9. DECLINE REWARD REDEMPTION & REFUND POINTS
  const handleRejectRedemption = (redemptionId: string) => {
    const item = redemptions.find(r => r.id === redemptionId);
    if (!item) return;

    // Refund points to Kid
    const updatedKids = kids.map(k => {
      if (k.id === item.kidId) {
        return { ...k, points: k.points + item.pointsCost };
      }
      return k;
    });

    // Restore stock inventory
    const updatedRewards = rewards.map(r => {
      if (r.id === item.rewardId && r.quantity !== -1) {
        return { ...r, quantity: r.quantity + 1 };
      }
      return r;
    });

    // Remove or soft decline
    const updatedRedemptions = redemptions.filter(r => r.id !== redemptionId);

    setKids(updatedKids);
    saveKids(updatedKids);
    setRewards(updatedRewards);
    saveRewards(updatedRewards);
    setRedemptions(updatedRedemptions);
    saveRedemptions(updatedRedemptions);
    updateActiveKidSessionData(updatedKids);
  };

  const calculatePenaltyForDate = (kidId: string, date: string, sessions: TvSession[]): number => {
    const targetKid = kids.find(k => k.id === kidId);
    const limitMinutes = targetKid?.screenTimeLimitMinutes ?? 60;
    const kidSessions = sessions.filter(s => s.kidId === kidId && s.date === date);
    const totalMinutes = kidSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    if (totalMinutes <= limitMinutes) {
      return 0;
    }
    const excessMinutes = totalMinutes - limitMinutes;
    return Math.floor(excessMinutes / 30) * 5;
  };

  const handleAddTvSession = (session: Omit<TvSession, "id" | "createdAt">) => {
    const { kidId, date } = session;
    const penaltyBefore = calculatePenaltyForDate(kidId, date, tvSessions);

    const newSession: TvSession = {
      ...session,
      id: "tv-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString()
    };
    const updated = [newSession, ...tvSessions];
    const penaltyAfter = calculatePenaltyForDate(kidId, date, updated);
    const penaltyDiff = penaltyAfter - penaltyBefore;

    const updatedKids = kids.map(k => {
      if (k.id === kidId) {
        return { ...k, points: Math.max(0, k.points - penaltyDiff) };
      }
      return k;
    });

    setKids(updatedKids);
    saveKids(updatedKids);
    setTvSessions(updated);
    saveTvSessions(updated);
    updateActiveKidSessionData(updatedKids);
  };

  const handleDeleteTvSession = (id: string) => {
    const sessionToDelete = tvSessions.find(s => s.id === id);
    if (!sessionToDelete) return;

    const { kidId, date } = sessionToDelete;
    const penaltyBefore = calculatePenaltyForDate(kidId, date, tvSessions);

    const updated = tvSessions.filter(s => s.id !== id);
    const penaltyAfter = calculatePenaltyForDate(kidId, date, updated);
    const penaltyDiff = penaltyAfter - penaltyBefore;

    const updatedKids = kids.map(k => {
      if (k.id === kidId) {
        return { ...k, points: Math.max(0, k.points - penaltyDiff) };
      }
      return k;
    });

    setKids(updatedKids);
    saveKids(updatedKids);
    setTvSessions(updated);
    saveTvSessions(updated);
    updateActiveKidSessionData(updatedKids);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500 selection:text-white pb-12">
      
      {/* Decorative header waves */}
      <div className="h-2 w-full bg-linear-to-r from-yellow-400 via-emerald-400 to-purple-500" />

      {/* Screen Router */}
      <AnimatePresence mode="wait">
        {!currentUser ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoginScreen
              kids={kids}
              parentPin={parentPin}
              onLoginAsParent={() => setCurrentUser({ role: "parent" })}
              onLoginAsKid={(kid) => setCurrentUser({ role: "kid", data: kid })}
            />
          </motion.div>
        ) : currentUser.role === "parent" ? (
          <motion.div
            key="parent-dash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ParentDashboard
              kids={kids}
              chores={chores}
              rewards={rewards}
              pending={pending}
              redemptions={redemptions}
              parentPin={parentPin}
              tvSessions={tvSessions}
              onUpdateParentPin={(newPin) => {
                setParentPin(newPin);
                saveParentPin(newPin);
              }}
              onAddChore={handleAddChore}
              onUpdateChore={handleUpdateChore}
              onDeleteChore={handleDeleteChore}
              onAddReward={handleAddReward}
              onDeleteReward={handleDeleteReward}
              onAddKid={handleAddKid}
              onUpdateKid={handleUpdateKid}
              onDeleteKid={handleDeleteKid}
              onApproveChore={handleApproveChore}
              onRejectChore={handleRejectChore}
              onApproveRedemption={handleApproveRedemption}
              onRejectRedemption={handleRejectRedemption}
              onAddTvSession={handleAddTvSession}
              onDeleteTvSession={handleDeleteTvSession}
              onLogout={handleLogout}
            />
          </motion.div>
        ) : (
          <motion.div
            key="kid-dash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <KidDashboard
              kid={currentUser.data!}
              chores={chores}
              rewards={rewards}
              pending={pending}
              redemptions={redemptions}
              tvSessions={tvSessions}
              onCompleteChore={handleCompleteChore}
              onRedeemReward={handleRedeemReward}
              onLogout={handleLogout}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
