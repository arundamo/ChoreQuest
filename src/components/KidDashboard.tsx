import React, { useState } from "react";
import { Kid, Chore, Reward, PendingChore, Redemption, TvSession } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Star, Shield, Gift, Trophy, ArrowLeft, Hourglass, CheckCircle, Award, Sparkles, Loader2, Tv } from "lucide-react";

interface KidDashboardProps {
  kid: Kid;
  chores: Chore[];
  rewards: Reward[];
  pending: PendingChore[];
  redemptions: Redemption[];
  tvSessions: TvSession[];
  onCompleteChore: (choreId: string) => void;
  onRedeemReward: (reward: Reward) => Promise<void>;
  onLogout: () => void;
}

type TabType = "chores" | "shop" | "wins";

interface SparkleParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  rotate: number;
}

export default function KidDashboard({
  kid,
  chores,
  rewards,
  pending,
  redemptions,
  tvSessions = [],
  onCompleteChore,
  onRedeemReward,
  onLogout
}: KidDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("chores");
  const [sparkles, setSparkles] = useState<SparkleParticle[]>([]);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [motivationalMsg, setMotivationalMsg] = useState("");
  const [lastRedeemedReward, setLastRedeemedReward] = useState<Reward | null>(null);
  const [loadingMotivate, setLoadingMotivate] = useState(false);

  // Filter chores relevant to this family member
  const myChores = chores.filter(c => {
    if (!c.isActive) return false;
    if (kid.role === "spouse") {
      return c.assignedTo === kid.id || c.assignedTo === "parents";
    }
    return c.assignedTo === kid.id || c.assignedTo === "all";
  });

  // Helper to convert ISO string to local YYYY-MM-DD date string
  const getLocalDateString = (isoString?: string) => {
    const d = isoString ? new Date(isoString) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Check if a chore was completed by this kid today (or simply has a pending / approved item in list)
  const getChoreStatus = (choreId: string) => {
    const targetChore = chores.find(c => c.id === choreId);
    const todayStr = getLocalDateString();

    // Find if there is a pending chore
    const match = pending.find(p => {
      if (p.choreId !== choreId || p.kidId !== kid.id) return false;
      if (targetChore?.frequency === "daily") {
        const completedDate = getLocalDateString(p.completedAt);
        return completedDate === todayStr && p.status === "pending";
      }
      return p.status === "pending";
    });
    if (match) return "pending";

    const approvedMatch = pending.find(p => {
      if (p.choreId !== choreId || p.kidId !== kid.id) return false;
      if (targetChore?.frequency === "daily") {
        const completedDate = getLocalDateString(p.completedAt);
        return completedDate === todayStr && p.status === "approved";
      }
      return p.status === "approved";
    });
    if (approvedMatch) {
      return "approved";
    }
    return "available";
  };

  // Trigger dynamic micro confetti explosion on chore complete click!
  const triggerConfettiExplosion = (clientX: number, clientY: number) => {
    const emojis = ["⭐", "🎉", "✨", "🍿", "🚀", "💥", "🎈", "🦖"];
    const newSparkles: SparkleParticle[] = Array.from({ length: 18 }).map((_, i) => ({
      id: Date.now() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      // Shoot out around click region or center
      x: (Math.random() - 0.5) * 260,
      y: (Math.random() - 0.5) * 260 - 50,
      rotate: Math.random() * 360
    }));

    setSparkles(newSparkles);

    // Clear sparkles after 1.2s to clean up DOM memory
    setTimeout(() => {
      setSparkles([]);
    }, 1200);
  };

  const handleChoreClick = (choreId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    // Get button click coordinates for explosion!
    const rect = event.currentTarget.getBoundingClientRect();
    triggerConfettiExplosion(rect.left + rect.width / 2, rect.top + rect.height / 2);
    
    // Call props to trigger state change
    onCompleteChore(choreId);
  };

  const handleRedeemClick = async (reward: Reward) => {
    if (kid.points < reward.pointsCost) return;
    
    setLoadingMotivate(true);
    setLastRedeemedReward(reward);
    setMotivationalMsg("");
    setIsCelebrationOpen(true);

    try {
      // Trigger API to generate custom child encouragement
      const response = await fetch("/api/motivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: kid.name, reward: reward.name })
      });
      const data = await response.json();
      if (response.ok && data.message) {
        setMotivationalMsg(data.message);
      } else {
        setMotivationalMsg(`Spectacular job, ${kid.name}! You have redeemed "${reward.name}". Go tell your parent to get your prize! 🎉`);
      }
    } catch (e) {
      // Fallback message
      setMotivationalMsg(`Spectacular job, ${kid.name}! You have redeemed "${reward.name}". Go tell your parent to get your prize! 🎉`);
    } finally {
      setLoadingMotivate(false);
      // Fulfill state
      await onRedeemReward(reward);
    }
  };

  // Badges Calculation based on statistics
  const approvedCount = pending.filter(p => p.kidId === kid.id && p.status === "approved").length;
  const redeemedCount = redemptions.filter(r => r.kidId === kid.id && r.status === "approved").length;
  
  const badges = kid.role === "spouse" ? [
    { id: "b1", name: "Super Spouse 🐾", desc: "Completed first co-parent task", unlocked: approvedCount >= 1, icon: "💑", color: "from-blue-400 to-indigo-500" },
    { id: "b2", name: "Team Player 🧹", desc: "Complete 5 co-parent chores", unlocked: approvedCount >= 5, icon: "⚡", color: "from-emerald-400 to-teal-500" },
    { id: "b3", name: "Household Captain 🌟", desc: "Earn 100+ credits total", unlocked: kid.totalEarned >= 100, icon: "👑", color: "from-amber-400 to-orange-500" },
    { id: "b4", name: "Legendary Partner ❤️", desc: "Earn 300+ credits total", unlocked: kid.totalEarned >= 300, icon: "💖", color: "from-red-400 to-rose-600" },
    { id: "b5", name: "Favor Collector 🎁", desc: "Redeem 1+ custom favor reward", unlocked: redeemedCount >= 1, icon: "💝", color: "from-purple-400 to-fuchsia-600" }
  ] : [
    { id: "b1", name: "First Step 👣", desc: "Completed your first chore", unlocked: approvedCount >= 1, icon: "👶", color: "from-blue-400 to-indigo-500" },
    { id: "b2", name: "Clean Machine 🧹", desc: "Do 5 approved chores", unlocked: approvedCount >= 5, icon: "⚡", color: "from-emerald-400 to-teal-500" },
    { id: "b3", name: "Super Star 🌟", desc: "Earn 100+ points total", unlocked: kid.totalEarned >= 100, icon: "⭐", color: "from-amber-400 to-orange-500" },
    { id: "b4", name: "Hero Knight ⚔️", desc: "Earn 300+ points total", unlocked: kid.totalEarned >= 300, icon: "👑", color: "from-red-400 to-rose-600" },
    { id: "b5", name: "Treasure Hunt 🎉", desc: "Redeem 1+ custom reward", unlocked: redeemedCount >= 1, icon: "🎁", color: "from-purple-400 to-fuchsia-600" }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      
      {/* Sparkles particle layer */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {sparkles.map((sparkle) => (
            <motion.div
              key={sparkle.id}
              initial={{ opacity: 1, scale: 0, x: window.innerWidth / 2, y: window.innerHeight / 2 - 100 }}
              animate={{ 
                opacity: [1, 1, 0], 
                scale: [0, 1.5, 0.4], 
                x: window.innerWidth / 2 + sparkle.x, 
                y: window.innerHeight / 2 - 100 + sparkle.y,
                rotate: sparkle.rotate
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, cubicBezier: [0.1, 0.8, 0.3, 1] }}
              className="absolute text-4xl select-none"
            >
              {sparkle.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header and points card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-4 border-b-2 border-slate-100">
        <div className="text-left space-y-1">
          <h2 className="font-display font-extrabold text-3xl md:text-4xl text-slate-800">
            Hi {kid.name}! {kid.role === "spouse" ? "💑" : "👋"}
          </h2>
          <p className="text-slate-500 font-sans font-medium text-base">
            {kid.role === "spouse" 
              ? "Completed your co-parent tasks? Check them off and earn credits for personalized rewards!"
              : "Ready to log your chores and claim awesome rewards? Let's do this!"
            }
          </p>
        </div>

        {/* Big Star Point Display */}
        <div className="flex items-center gap-4 bg-yellow-100/75 border-4 border-yellow-300 rounded-3xl p-4 shadow-sm self-start md:self-center">
          <div className="relative">
            <Star className="text-yellow-600 fill-yellow-500 animate-spin" size={44} style={{ animationDuration: '8s' }} />
            <span className="absolute inset-0 flex items-center justify-center font-bold text-yellow-800 text-lg leading-none">
              {kid.role === "spouse" ? "🍷" : "🪙"}
            </span>
          </div>
          <div className="text-left">
            <div className="text-4xl font-display font-black text-yellow-950 font-mono inline-block leading-none">{kid.points}</div>
            <div className="text-2xs uppercase tracking-wider font-extrabold text-yellow-800">
              {kid.role === "spouse" ? "Available Duty Credits" : "Available Star Coins"}
            </div>
          </div>
        </div>
      </div>

      {/* TV Screen Time Banner (Only for kids) */}
      {kid.role !== "spouse" && (() => {
        const todayStr = new Date().toISOString().split("T")[0];
        const todaySessions = tvSessions.filter(s => s.kidId === kid.id && s.date === todayStr);
        const totalMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        if (totalMinutes === 0) return null;

        const limitMinutes = kid.screenTimeLimitMinutes ?? 60;
        const percent = Math.min(100, (totalMinutes / limitMinutes) * 100);

        let barColor = "bg-emerald-500";
        let textColor = "text-emerald-700";
        let bgFill = "bg-emerald-50";
        let borderStyle = "border-emerald-100";
        if (totalMinutes > limitMinutes + 30) {
          barColor = "bg-rose-500";
          textColor = "text-rose-700";
          bgFill = "bg-rose-50";
          borderStyle = "border-rose-100";
        } else if (totalMinutes > limitMinutes) {
          barColor = "bg-amber-500";
          textColor = "text-amber-700";
          bgFill = "bg-amber-50";
          borderStyle = "border-amber-100";
        }

        const excessMinutes = totalMinutes - limitMinutes;
        const penaltyPoints = excessMinutes > 0 ? Math.floor(excessMinutes / 30) * 5 : 0;

        return (
          <div className={`p-4 rounded-3xl border-3 ${bgFill} ${borderStyle} text-left mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500 text-white rounded-xl">
                <Tv size={20} />
              </div>
              <div>
                <h4 className="font-display font-bold text-slate-800 text-sm md:text-base">Your Daily Screen Time</h4>
                <p className="text-xs text-slate-400 font-sans font-medium">
                  {penaltyPoints > 0 ? (
                    <span className="text-rose-600 font-bold">⚠️ Penalty Applied: -{penaltyPoints} points</span>
                  ) : (
                    "Logged today by parents in intervals."
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex-1 max-w-md">
              <div className="flex justify-between items-center text-xs mb-1 font-semibold text-slate-500">
                <span>Usage: {totalMinutes}m / {limitMinutes}m</span>
                {totalMinutes > limitMinutes ? (
                  <span className={`${textColor} font-bold`}>
                    {penaltyPoints > 0 ? `-${penaltyPoints} pts penalty` : "Over target limit!"}
                  </span>
                ) : (
                  <span>Great job pacing!</span>
                )}
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Navigation tabs with role-specific theme */}
      <div className="grid grid-cols-3 bg-slate-100 p-2 rounded-2xl mb-8 font-display font-black text-sm md:text-base border-2 border-slate-200">
        <button
          onClick={() => setActiveTab("chores")}
          className={`py-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "chores"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🧹 {kid.role === "spouse" ? "Spouse Chores" : "My Chores"}
        </button>
        <button
          onClick={() => setActiveTab("shop")}
          className={`py-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "shop"
              ? "bg-purple-500 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🎁 {kid.role === "spouse" ? "Spouse Rewards" : "Toy Store"}
        </button>
        <button
          onClick={() => setActiveTab("wins")}
          className={`py-3.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "wins"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🏆 {kid.role === "spouse" ? "Achievements" : "My Badges"}
        </button>
      </div>

      {/* Main Tab Panels */}
      <div className="min-h-[40vh]">
        
        {/* T1: MY CHORES */}
        {activeTab === "chores" && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-2xl text-slate-800 text-left mb-4">
              {kid.role === "spouse" ? "Co-Parent Duty Logs" : "Daily Quest Logs"}
            </h3>

            {myChores.length === 0 ? (
              <div className="bento-card p-12 text-center text-slate-400 bg-white">
                <span className="text-5xl inline-block mb-3">🌴</span>
                <p className="font-display font-bold text-lg">
                  {kid.role === "spouse" ? "Woohoo! All co-parent tasks are done or unassigned." : "Hooray! No chores assigned to you."}
                </p>
                <p className="font-sans text-sm mt-1">
                  {kid.role === "spouse" ? "Put your feet up, enjoy some coffee, and check back later!" : "Go out, play, and check back later for updates!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myChores.map((chore) => {
                  const status = getChoreStatus(chore.id);
                  return (
                    <motion.div
                      key={chore.id}
                      className={`bento-card p-5 border-4 transition-all text-left flex flex-col justify-between ${
                        status === "pending"
                          ? "border-amber-300 bg-amber-50/10 opacity-90"
                          : status === "approved"
                          ? "border-emerald-300 bg-emerald-50/10 opacity-75"
                          : "border-slate-100 bg-white hover:border-emerald-200"
                      }`}
                    >
                      <div className="space-y-1 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-sans uppercase font-bold text-slate-400 tracking-wider">
                            🔄 {chore.frequency} Quest
                          </span>
                          {status === "pending" && (
                            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                              <Hourglass size={12} className="animate-spin" /> Pending Approval
                            </span>
                          )}
                          {status === "approved" && (
                            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                              <CheckCircle size={12} /> Claim Approved!
                            </span>
                          )}
                        </div>
                        <h4 className="font-display font-black text-xl text-slate-800 leading-tight">
                          {chore.name}
                        </h4>
                        <div className="text-2xl font-display font-black text-amber-500 font-mono mt-1">
                          ⭐ {chore.points} <span className="text-xs uppercase font-sans font-extrabold text-slate-400">{kid.role === "spouse" ? "credits" : "coins"}</span>
                        </div>
                      </div>

                      {/* Giant touch tap action button */}
                      {status === "available" ? (
                        <button
                          onClick={(e) => handleChoreClick(chore.id, e)}
                          className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] text-white font-display font-black text-lg rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer border-b-6 border-emerald-700"
                        >
                          Done! ✅
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3.5 bg-slate-150 text-slate-400 font-display font-bold text-base rounded-2xl border-2 border-slate-200 flex items-center justify-center gap-2 select-none cursor-not-allowed"
                        >
                          {status === "pending" ? "Waiting for verification ⏳" : "Completed! Good job 🎉"}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* T2: TOY REWARDS STORE */}
        {activeTab === "shop" && (
          <div className="space-y-4">
            <h3 className="font-display font-bold text-2xl text-slate-800 text-left mb-1">
              {kid.role === "spouse" ? "Partner Rewards Lounge" : "Reward Market Store"}
            </h3>
            <p className="text-slate-400 text-sm font-sans text-left mb-4">
              {kid.role === "spouse"
                ? "Trade your co-parent credits for sweet favors, relaxing massages, and exciting dates!"
                : "Trade your earned Star Coins for sweet treats, games, and screen privileges!"
              }
            </p>

            {rewards.length === 0 ? (
              <div className="bento-card p-12 text-center text-slate-400 bg-white">
                <span className="text-5xl inline-block mb-3">🧸</span>
                <p className="font-display font-bold text-lg">
                  {kid.role === "spouse" ? "No couple rewards have been configured yet." : "Store shelves are empty."}
                </p>
                <p className="font-sans text-sm mt-1">
                  {kid.role === "spouse" ? "Add personalized favors or items in the Parent Dashboard!" : "Ask your mom or dad to add sweet prizes!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => {
                  const outOfStock = reward.quantity !== -1 && reward.quantity <= 0;
                  const canAfford = kid.points >= reward.pointsCost;
                  const isPendingInQueue = redemptions.some(r => r.rewardId === reward.id && r.kidId === kid.id && r.status === "pending");

                  return (
                    <div
                      key={reward.id}
                      className={`bento-card p-5 border-4 flex flex-col justify-between text-left ${
                        isPendingInQueue 
                          ? "border-purple-300 bg-purple-50/10 opacity-90"
                          : outOfStock
                          ? "border-slate-100 bg-slate-50/40 opacity-60"
                          : "border-slate-100 bg-white hover:border-purple-200"
                      }`}
                    >
                      <div className="space-y-1.5 mb-6">
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-sans uppercase font-bold text-slate-400 tracking-wider">
                            {reward.quantity === -1 ? "♾️ Unlimited stock" : `🎟️ Stocks Left: ${reward.quantity}`}
                          </span>
                          {isPendingInQueue && (
                            <span className="text-xs bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-200">
                              <Hourglass size={12} className="animate-spin" /> Pending Hand Out
                            </span>
                          )}
                        </div>

                        <h4 className="font-display font-black text-xl text-slate-800 leading-tight">
                          {reward.name}
                        </h4>

                        <div className="text-2xl font-display font-black text-amber-500 font-mono mt-1">
                          🎁 {reward.pointsCost} <span className="text-xs uppercase font-sans font-extrabold text-slate-400">{kid.role === "spouse" ? "Credits" : "Coins"}</span>
                        </div>
                      </div>

                      {isPendingInQueue ? (
                        <button
                          disabled
                          className="w-full py-3 bg-slate-100 border-2 border-slate-200 text-slate-400 font-display font-bold rounded-2xl select-none cursor-not-allowed text-center"
                        >
                          Awaiting parent approval ⏳
                        </button>
                      ) : outOfStock ? (
                        <button
                          disabled
                          className="w-full py-3 bg-slate-100 text-slate-400 font-display font-bold rounded-2xl select-none cursor-not-allowed text-center"
                        >
                          Sold Out! 😢
                        </button>
                      ) : canAfford ? (
                        <button
                          onClick={() => handleRedeemClick(reward)}
                          className="w-full py-3 bg-purple-500 hover:bg-purple-600 active:scale-[0.98] text-white font-display font-black text-lg rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer border-b-6 border-purple-700"
                        >
                          Claim Prize! 🎁
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3 bg-slate-100 text-slate-400 font-display font-bold rounded-2xl select-none cursor-not-allowed text-center"
                        >
                          Need {reward.pointsCost - kid.points} more {kid.role === "spouse" ? "Credits" : "Coins"}! {kid.role === "spouse" ? "🍷" : "🪙"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* T3: ACHIEVEMENTS & WINS */}
        {activeTab === "wins" && (
          <div className="space-y-6">
            
            {/* Stats summaries */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 border-3 border-yellow-250 p-4 rounded-2xl text-left">
                <span className="text-xs font-bold text-yellow-800 uppercase tracking-wide">All-Time Wealth Accumulated</span>
                <div className="text-3xl font-display font-black text-yellow-950 font-mono mt-1">🏆 {kid.totalEarned} pts</div>
              </div>
              <div className="bg-emerald-50 border-3 border-emerald-200 p-4 rounded-2xl text-left">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Cleanups Finished Approved</span>
                <div className="text-3xl font-display font-black text-emerald-950 font-mono mt-1">🧹 {approvedCount} jobs</div>
              </div>
            </div>

            {/* Badges Grid Collection */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-xl text-slate-800 text-left">My Quest Achievements</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((b) => (
                  <div
                    key={b.id}
                    className={`bento-card p-4 border-2 flex items-center gap-3 text-left ${
                      b.unlocked 
                        ? "border-amber-250 bg-amber-50/10" 
                        : "border-slate-100 bg-slate-50/20 opacity-50 select-none"
                    }`}
                  >
                    <div className={`w-14 h-14 bg-linear-to-br ${b.unlocked ? b.color : 'from-slate-200 to-slate-300'} rounded-2xl flex items-center justify-center text-3xl shadow-sm decrease-transform hover:scale-115 transition`}>
                      {b.unlocked ? b.icon : "🔒"}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-slate-800 flex items-center gap-1">
                        {b.name}
                        {b.unlocked && <Sparkles size={11} className="text-amber-500 fill-amber-300 shrink-0" />}
                      </h4>
                      <p className="text-xxs text-slate-400 font-sans font-medium mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Wins History Timeline feed */}
            <div className="space-y-3 pt-4 border-t-2 border-slate-100">
              <h3 className="font-display font-bold text-xl text-slate-800 text-left">Activity History Timeline</h3>

              {pending.filter(p => p.kidId === kid.id && p.status === "approved").length === 0 ? (
                <p className="text-sm text-slate-400 text-left py-4">No completed chore logs approved yet. Clean your first bed or toy basket to see it here!</p>
              ) : (
                <div className="relative border-l-2 border-slate-250 ml-3 text-left pl-6 space-y-4 py-2 font-sans text-sm">
                  {pending.filter(p => p.kidId === kid.id && p.status === "approved").map((log) => (
                    <div key={log.id} className="relative">
                      {/* Circle bullet */}
                      <span className="absolute -left-[31px] top-1 w-4.5 h-4.5 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center shadow-xs" />
                      
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-sm">
                        <span className="text-3xs font-mono font-bold uppercase text-slate-400">
                          {new Date(log.completedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <h4 className="font-bold text-slate-700 mt-0.5 capitalize">{log.choreName}</h4>
                        <div className="text-xs text-emerald-600 font-bold mt-0.5">Approved! Earned +{log.points} Points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* MODAL Celebration / AI Motivational message */}
      <AnimatePresence>
        {isCelebrationOpen && lastRedeemedReward && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border-4 border-purple-300 shadow-2xl text-center space-y-6"
            >
              <div className="text-6xl animate-bounce-gentle mt-2">🥳🎁🏆</div>
              
              <div className="space-y-1">
                <h3 className="font-display font-black text-2xl text-indigo-900">
                  Prize Redeemed!
                </h3>
                <p className="text-sm font-sans text-slate-400">
                  You unlocked: <strong className="text-purple-700 capitalize">{lastRedeemedReward.name}</strong>
                </p>
              </div>

              {/* Display AI Message */}
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200 text-left min-h-[100px] flex flex-col justify-center">
                {loadingMotivate ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-indigo-600 font-display font-medium text-sm py-4">
                    <Loader2 className="animate-spin text-purple-600" size={28} />
                    <span>Gemini is painting a cute victory letter...</span>
                  </div>
                ) : (
                  <p className="text-indigo-900 font-display font-medium text-base leading-relaxed text-center italic">
                    "{motivationalMsg}"
                  </p>
                )}
              </div>

              <div className="text-2xs text-slate-400 font-sans leading-tight">
                This privilege request was sent directly to your parents. Go let them know so they can hand you the coordinates!
              </div>

              <button
                onClick={() => { setIsCelebrationOpen(false); setLastRedeemedReward(null); }}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-display font-black text-lg rounded-2xl transition cursor-pointer border-b-6 border-purple-800 hover:scale-[1.01]"
              >
                Super Cool! 👍
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-12 text-center">
        <button
          onClick={onLogout}
          className="px-6 py-2 bg-slate-105 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition font-sans font-bold text-sm rounded-xl cursor-pointer"
        >
          Logout / Switch User Profile
        </button>
      </div>

    </div>
  );
}
