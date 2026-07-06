import React, { useState } from "react";
import { Kid, Chore, Reward, PendingChore, Redemption, AISuggestedChore, AISuggestedReward, TvSession } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Plus, Trash2, Edit2, Check, X, ShieldAlert, 
  Users, Award, ClipboardList, CheckSquare, History, UserPlus, LogOut, Loader2, Tv
} from "lucide-react";

export const CHORE_PRESETS: Record<string, { name: string; points: number; frequency: 'daily' | 'weekly' | 'one-time' }> = {
  clean_bedroom: { name: "Clean Bedroom 🧹", points: 30, frequency: "daily" },
  make_bed: { name: "Make Bed 🛏️", points: 10, frequency: "daily" },
  vacuum_living_room: { name: "Vacuum Living Room 🧹", points: 40, frequency: "weekly" },
  mop_floors: { name: "Mop Floors 🧼", points: 50, frequency: "weekly" },
  take_out_trash: { name: "Take out Trash 🗑️", points: 15, frequency: "daily" },
  wash_dishes: { name: "Wash Dishes 🍽️", points: 25, frequency: "daily" },
  clean_dining_table: { name: "Clean Dining Table 🧽", points: 15, frequency: "daily" },
  load_dishwasher: { name: "Load/Empty Dishwasher 🍽️", points: 20, frequency: "daily" },
  do_homework: { name: "Do Homework 📚", points: 25, frequency: "daily" },
  read_book: { name: "Read for 20 mins 📖", points: 20, frequency: "daily" },
  brush_teeth: { name: "Brush Teeth 🪥", points: 10, frequency: "daily" },
  feed_pets: { name: "Feed Pets 🐕", points: 15, frequency: "daily" },
  water_plants: { name: "Water Plants 🌱", points: 15, frequency: "weekly" },
  wash_car: { name: "Wash the Car 🚗", points: 80, frequency: "one-time" },
};

interface ParentDashboardProps {
  kids: Kid[];
  chores: Chore[];
  rewards: Reward[];
  pending: PendingChore[];
  redemptions: Redemption[];
  parentPin: string;
  tvSessions?: TvSession[];
  onUpdateParentPin: (newPin: string) => void;
  onAddChore: (chore: Omit<Chore, "id" | "createdAt" | "isActive">) => void;
  onUpdateChore: (id: string, updated: Partial<Chore>) => void;
  onDeleteChore: (id: string) => void;
  onAddReward: (reward: Omit<Reward, "id" | "createdAt">) => void;
  onDeleteReward: (id: string) => void;
  onAddKid: (name: string, pin: string, role?: 'kid' | 'spouse', screenTimeLimitMinutes?: number) => void;
  onUpdateKid: (id: string, name: string, pin: string, points: number, role?: 'kid' | 'spouse', screenTimeLimitMinutes?: number) => void;
  onDeleteKid: (id: string) => void;
  onApproveChore: (pendingId: string) => void;
  onRejectChore: (pendingId: string) => void;
  onApproveRedemption: (redemptionId: string) => void;
  onRejectRedemption: (redemptionId: string) => void;
  onAddTvSession: (session: Omit<TvSession, "id" | "createdAt">) => void;
  onDeleteTvSession: (id: string) => void;
  onLogout: () => void;
}

type TabType = "chores" | "rewards" | "approvals" | "kids" | "tv";

export default function ParentDashboard({
  kids,
  chores,
  rewards,
  pending,
  redemptions,
  parentPin,
  tvSessions = [],
  onUpdateParentPin,
  onAddChore,
  onUpdateChore,
  onDeleteChore,
  onAddReward,
  onDeleteReward,
  onAddKid,
  onUpdateKid,
  onDeleteKid,
  onApproveChore,
  onRejectChore,
  onApproveRedemption,
  onRejectRedemption,
  onAddTvSession,
  onDeleteTvSession,
  onLogout
}: ParentDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("chores");
  
  // Forms states
  const [choreForm, setChoreForm] = useState({ name: "", points: 30, assignedTo: "", frequency: "daily" as any });
  const [createPresetKey, setCreatePresetKey] = useState<string>("custom");
  const [rewardForm, setRewardForm] = useState({ name: "", pointsCost: 50, quantity: -1 });
  const [kidForm, setKidForm] = useState({ name: "", pin: "", role: "kid" as "kid" | "spouse", screenTimeLimitMinutes: 60 });

  const [tvForm, setTvForm] = useState({
    kidId: "",
    durationMinutes: 30,
    notes: "",
    date: new Date().toISOString().split("T")[0]
  });
  const [tvError, setTvError] = useState("");
  const [tvSuccess, setTvSuccess] = useState("");

  // Parent Passcode Edit State
  const [newParentPin, setNewParentPin] = useState("");
  const [parentPinError, setParentPinError] = useState("");
  const [parentPinSuccess, setParentPinSuccess] = useState("");

  const [kidError, setKidError] = useState("");
  const [choreError, setChoreError] = useState("");
  const [rewardError, setRewardError] = useState("");

  // Chore Edit States
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  const [editChoreForm, setEditChoreForm] = useState({ name: "", points: 30, assignedTo: "", frequency: "daily" as any });
  const [editPresetKey, setEditPresetKey] = useState<string>("custom");
  const [editChoreError, setEditChoreError] = useState("");

  // Kid Edit States
  const [editingKidId, setEditingKidId] = useState<string | null>(null);
  const [editKidForm, setEditKidForm] = useState({ name: "", pin: "", points: 0, role: "kid" as "kid" | "spouse", screenTimeLimitMinutes: 60 });
  const [editKidError, setEditKidError] = useState("");
  const [kidIdToDelete, setKidIdToDelete] = useState<string | null>(null);
  const [choreIdToDelete, setChoreIdToDelete] = useState<string | null>(null);

  // AI Dialog States
  const [aiChoreOpen, setAiChoreOpen] = useState(false);
  const [aiRewardOpen, setAiRewardOpen] = useState(false);
  const [aiAge, setAiAge] = useState(8);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiErrorMsg, setAiErrorMsg] = useState("");
  const [aiSuggestedChores, setAiSuggestedChores] = useState<AISuggestedChore[]>([]);
  const [aiSuggestedRewards, setAiSuggestedRewards] = useState<AISuggestedReward[]>([]);

  // Selected Kid for History view
  const [selectedKidHistoryId, setSelectedKidHistoryId] = useState<string>("");

  // Statistics counters
  const totalCreatedChores = chores.filter(c => c.isActive).length;
  const pendingApprovalsCount = pending.filter(p => p.status === "pending").length + redemptions.filter(r => r.status === "pending").length;
  const rewardsCount = rewards.length;
  const kidsCount = kids.filter(k => !k.role || k.role === "kid").length;
  const spousesCount = kids.filter(k => k.role === "spouse").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTvMinutes = tvSessions
    .filter(s => s.date === todayStr)
    .reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleLogTvSession = (e: React.FormEvent) => {
    e.preventDefault();
    setTvError("");
    setTvSuccess("");
    const { kidId, durationMinutes, notes, date } = tvForm;

    if (!kidId) return setTvError("Please select a child!");
    if (durationMinutes <= 0) return setTvError("Duration must be more than 0 minutes!");
    if (!date) return setTvError("Please select a valid date!");

    const kid = kids.find(k => k.id === kidId);
    if (!kid) return setTvError("Selected child not found!");

    onAddTvSession({
      kidId,
      kidName: kid.name,
      durationMinutes,
      notes: notes.trim() || undefined,
      date
    });

    setTvForm(prev => ({
      ...prev,
      durationMinutes: 30,
      notes: ""
    }));
    setTvSuccess(`Successfully logged ${durationMinutes} minutes for ${kid.name}!`);
    setTimeout(() => setTvSuccess(""), 4000);
  };

  const handleCreateKid = (e: React.FormEvent) => {
    e.preventDefault();
    setKidError("");
    const { name, pin, role, screenTimeLimitMinutes } = kidForm;
    
    if (!name.trim()) return setKidError("Name can't be empty!");
    if (!/^\d{4}$/.test(pin)) return setKidError("PIN must be exactly 4 numbers (e.g. 1234)!");

    onAddKid(name.trim(), pin, role, role === "spouse" ? undefined : screenTimeLimitMinutes);
    setKidForm({ name: "", pin: "", role: "kid", screenTimeLimitMinutes: 60 });
  };

  const handleCreatePresetChange = (key: string) => {
    setCreatePresetKey(key);
    if (key !== "custom" && CHORE_PRESETS[key]) {
      const preset = CHORE_PRESETS[key];
      setChoreForm(prev => ({
        ...prev,
        name: preset.name,
        points: preset.points,
        frequency: preset.frequency,
      }));
    }
  };

  const handleEditPresetChange = (key: string) => {
    setEditPresetKey(key);
    if (key !== "custom" && CHORE_PRESETS[key]) {
      const preset = CHORE_PRESETS[key];
      setEditChoreForm(prev => ({
        ...prev,
        name: preset.name,
        points: preset.points,
        frequency: preset.frequency,
      }));
    }
  };

  const handleCreateChore = (e: React.FormEvent) => {
    e.preventDefault();
    setChoreError("");
    const { name, points, assignedTo, frequency } = choreForm;

    if (!name.trim()) return setChoreError("Chore name is required!");
    if (points < 10 || points > 100) return setChoreError("Points must be between 10 and 100!");
    if (!assignedTo) return setChoreError("Please assign this chore to someone!");

    onAddChore({ name: name.trim(), points, assignedTo, frequency });
    setChoreForm({ name: "", points: 30, assignedTo: "", frequency: "daily" });
    setCreatePresetKey("custom");
  };

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    setRewardError("");
    const { name, pointsCost, quantity } = rewardForm;

    if (!name.trim()) return setRewardError("Reward name is required!");
    if (pointsCost < 1) return setRewardError("Points cost must be at least 1 point!");

    onAddReward({ name: name.trim(), pointsCost, quantity });
    setRewardForm({ name: "", pointsCost: 50, quantity: -1 });
  };

  // AI suggest chores handler
  const handleQueryAIChores = async () => {
    setAiLoading(true);
    setAiErrorMsg("");
    setAiSuggestedChores([]);
    try {
      const response = await fetch("/api/suggest-chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: aiAge })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate suggest chores");
      }
      setAiSuggestedChores(data);
    } catch (err: any) {
      setAiErrorMsg(err.message || "Something went wrong. Please confirm your API Key setup.");
    } finally {
      setAiLoading(false);
    }
  };

  // AI suggest rewards handler
  const handleQueryAIRewards = async () => {
    setAiLoading(true);
    setAiErrorMsg("");
    setAiSuggestedRewards([]);
    try {
      const response = await fetch("/api/suggest-rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age: aiAge })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate suggest rewards");
      }
      setAiSuggestedRewards(data);
    } catch (err: any) {
      setAiErrorMsg(err.message || "Something went wrong. Please confirm your API Key setup.");
    } finally {
      setAiLoading(false);
    }
  };

  const addAISuggestedChore = (suggested: AISuggestedChore, kidId: string) => {
    onAddChore({
      name: suggested.name,
      points: Math.min(100, Math.max(10, suggested.points)),
      assignedTo: kidId,
      frequency: "daily"
    });
    // Visual feedback - filter out item from local suggestions
    setAiSuggestedChores(prev => prev.filter(c => c.name !== suggested.name));
  };

  const addAISuggestedReward = (suggested: AISuggestedReward) => {
    onAddReward({
      name: suggested.name,
      pointsCost: suggested.suggestedPoints || 50,
      quantity: -1
    });
    // Visual feedback
    setAiSuggestedRewards(prev => prev.filter(r => r.name !== suggested.name));
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4">
      {/* Top Banner Parent Mode */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b-2 border-slate-100 gap-4">
        <div>
          <h2 className="font-display font-extrabold text-3xl text-indigo-900 flex items-center gap-2">
            👨‍👩‍👧‍👦 Parent Control Panel
          </h2>
          <p className="text-slate-500 font-sans text-sm mt-0.5">
            Create goals, approve completed duties, and review your children's statistics.
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 transition font-display font-bold text-sm rounded-xl cursor-pointer self-start md:self-center"
        >
          <LogOut size={16} />
          Lock / Back to Select
        </button>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <button
          onClick={() => setActiveTab("chores")}
          className="bg-amber-50 border-3 border-amber-100 hover:border-amber-300 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-98 text-left w-full block focus:outline-hidden focus:ring-2 focus:ring-amber-400"
        >
          <div className="p-3 bg-amber-500 text-white rounded-xl">
            <ClipboardList size={22} />
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-bold">Chores Live</div>
            <div className="text-2xl font-mono font-bold text-slate-800">{totalCreatedChores}</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("approvals")}
          className="bg-emerald-50 border-3 border-emerald-100 hover:border-emerald-300 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-98 text-left w-full block focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
        >
          <div className="p-3 bg-emerald-500 text-white rounded-xl">
            <CheckSquare size={22} />
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-bold">Needs Approval</div>
            <div className={`text-2xl font-mono font-bold ${pendingApprovalsCount > 0 ? 'text-emerald-600 font-extrabold animate-pulse' : 'text-slate-800'}`}>
              {pendingApprovalsCount}
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("rewards")}
          className="bg-purple-50 border-3 border-purple-100 hover:border-purple-300 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-98 text-left w-full block focus:outline-hidden focus:ring-2 focus:ring-purple-400"
        >
          <div className="p-3 bg-purple-500 text-white rounded-xl">
            <Award size={22} />
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-bold">Gift Rewards</div>
            <div className="text-2xl font-mono font-bold text-slate-800">{rewardsCount}</div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("kids")}
          className="bg-sky-50 border-3 border-sky-100 hover:border-sky-300 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-98 text-left w-full block focus:outline-hidden focus:ring-2 focus:ring-sky-400"
        >
          <div className="p-3 bg-sky-500 text-white rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-bold">Active Kids</div>
            <div className="text-2xl font-mono font-bold text-slate-800">
              {kidsCount}
              {spousesCount > 0 && (
                <span className="text-xs text-slate-400 font-sans font-medium ml-2">
                  (+{spousesCount} {spousesCount === 1 ? 'Spouse' : 'Spouses'})
                </span>
              )}
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("tv")}
          className="bg-rose-50 border-3 border-rose-100 hover:border-rose-300 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-98 text-left w-full block focus:outline-hidden focus:ring-2 focus:ring-rose-400"
        >
          <div className="p-3 bg-rose-500 text-white rounded-xl">
            <Tv size={22} />
          </div>
          <div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-bold">TV Time Today</div>
            <div className="text-2xl font-mono font-bold text-slate-800">
              {todayTvMinutes} <span className="text-xs text-slate-400 uppercase font-sans font-bold">mins</span>
            </div>
          </div>
        </button>
      </div>

      {/* Interactive Tabs Menu */}
      <div className="flex border-b-2 border-slate-100 mb-6 font-display font-bold text-sm overflow-x-auto gap-2 md:gap-4 whitespace-nowrap">
        <button
          onClick={() => setActiveTab("chores")}
          className={`pb-3 border-b-3 px-2 ${activeTab === "chores" ? "border-indigo-600 text-indigo-800 text-base" : "border-transparent text-slate-400 hover:text-slate-600"} transition flex items-center gap-1.5 cursor-pointer`}
        >
          🧹 Manage Chores
        </button>
        <button
          onClick={() => setActiveTab("rewards")}
          className={`pb-3 border-b-3 px-2 ${activeTab === "rewards" ? "border-indigo-600 text-indigo-800 text-base" : "border-transparent text-slate-400 hover:text-slate-600"} transition flex items-center gap-1.5 cursor-pointer`}
        >
          🎁 Rewards Catalog
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`pb-3 border-b-3 px-2 ${activeTab === "approvals" ? "border-indigo-600 text-indigo-800 text-base" : "border-transparent text-slate-400 hover:text-slate-600"} transition flex items-center gap-1.5 cursor-pointer`}
        >
          🔔 Approvals Queue ({pendingApprovalsCount})
        </button>
        <button
          onClick={() => setActiveTab("kids")}
          className={`pb-3 border-b-3 px-2 ${activeTab === "kids" ? "border-indigo-600 text-indigo-800 text-base" : "border-transparent text-slate-400 hover:text-slate-600"} transition flex items-center gap-1.5 cursor-pointer`}
        >
          👨‍👩‍👧‍👦 Family Profiles
        </button>
        <button
          onClick={() => setActiveTab("tv")}
          className={`pb-3 border-b-3 px-2 ${activeTab === "tv" ? "border-indigo-600 text-indigo-800 text-base" : "border-transparent text-slate-400 hover:text-slate-600"} transition flex items-center gap-1.5 cursor-pointer`}
        >
          📺 TV Screen Time
        </button>
      </div>

      {/* Primary Tab Panels Content */}
      <div className="min-h-[40vh]">
        
        {/* TAB 1: CHORES */}
        {activeTab === "chores" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-white p-6 rounded-3xl border-4 border-slate-100 shadow-xs h-fit">
              <h3 className="font-display font-bold text-xl text-slate-800 mb-4 flex items-center justify-between">
                <span>Add Custom Chore</span>
                <span className="text-xs font-sans text-indigo-600 font-medium bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">Assigner</span>
              </h3>
              
              <form onSubmit={handleCreateChore} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Pick Existing / Preset Chore</label>
                  <select
                    value={createPresetKey}
                    onChange={(e) => handleCreatePresetChange(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans bg-white cursor-pointer"
                  >
                    <option value="custom">✍️ Create custom/new chore...</option>
                    <optgroup label="🧹 Cleaning & Tidying">
                      <option value="clean_bedroom">Clean Bedroom 🧹 (30 pts)</option>
                      <option value="make_bed">Make Bed 🛏️ (10 pts)</option>
                      <option value="vacuum_living_room">Vacuum Living Room 🧹 (40 pts)</option>
                      <option value="mop_floors">Mop Floors 🧼 (50 pts)</option>
                      <option value="take_out_trash">Take out Trash 🗑️ (15 pts)</option>
                    </optgroup>
                    <optgroup label="🍽️ Kitchen & Meals">
                      <option value="wash_dishes">Wash Dishes 🍽️ (25 pts)</option>
                      <option value="clean_dining_table">Clean Dining Table 🧽 (15 pts)</option>
                      <option value="load_dishwasher">Load/Empty Dishwasher 🍽️ (20 pts)</option>
                    </optgroup>
                    <optgroup label="📚 Studies & Routines">
                      <option value="do_homework">Do Homework 📚 (25 pts)</option>
                      <option value="read_book">Read for 20 mins 📖 (20 pts)</option>
                      <option value="brush_teeth">Brush Teeth 🪥 (10 pts)</option>
                    </optgroup>
                    <optgroup label="🐾 Pets & Outdoors">
                      <option value="feed_pets">Feed Pets 🐕 (15 pts)</option>
                      <option value="water_plants">Water Plants 🌱 (15 pts)</option>
                      <option value="wash_car">Wash the Car 🚗 (80 pts)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Chore Name (Or edit chosen template)</label>
                  <input
                    type="text"
                    placeholder="e.g. Clean the rabbit cage 🧹"
                    value={choreForm.name}
                    onChange={(e) => {
                      setCreatePresetKey("custom");
                      setChoreForm(prev => ({ ...prev, name: e.target.value }));
                    }}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Points (10-100)</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={choreForm.points}
                      onChange={(e) => setChoreForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Frequency</label>
                    <select
                      value={choreForm.frequency}
                      onChange={(e) => setChoreForm(prev => ({ ...prev, frequency: e.target.value as any }))}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans bg-white cursor-pointer"
                    >
                      <option value="daily">Daily ☀️</option>
                      <option value="weekly">Weekly 🗓️</option>
                      <option value="one-time">One-time ⚡</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Assign To</label>
                  <select
                    value={choreForm.assignedTo}
                    onChange={(e) => setChoreForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans bg-white cursor-pointer"
                  >
                    <option value="">-- Who must do it? --</option>
                    <option value="all">🧒 All Kids (Separate Copies)</option>
                    <option value="parents">👨‍👩‍👧‍👦 Both Parents</option>
                    
                    <optgroup label="🧒 Children Directory">
                      {kids.filter(k => !k.role || k.role === "kid").map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </optgroup>

                    <optgroup label="💑 Spouses & Partners Directory">
                      {kids.filter(k => k.role === "spouse").map(k => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {choreError && <p className="text-rose-500 text-xs font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{choreError}</p>}

                <button
                  id="btn-add-chore-submit"
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-display font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={18} />
                  Add Chore to List
                </button>
              </form>

              <div className="border-t-2 border-slate-100 my-5 pt-5">
                <button
                  type="button"
                  onClick={() => { setAiChoreOpen(true); setAiSuggestedChores([]); setAiErrorMsg(""); }}
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-display font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer border border-yellow-500"
                >
                  <Sparkles size={16} />
                  ✨ Suggest Chores with AI
                </button>
              </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-display font-bold text-xl text-slate-800 flex items-center justify-between">
                <span>Active Duty Registry</span>
                <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-sans font-medium">Click garbage can to remove</span>
              </h3>

              {chores.length === 0 ? (
                <div className="bento-card p-12 text-center text-slate-400">
                  <p className="font-display font-bold text-lg">Your Chore list is empty</p>
                  <p className="font-sans text-sm mt-1">Make child duties first or use AI suggestion tools.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chores.filter(c => c.isActive).map((chore) => {
                    const isEditing = editingChoreId === chore.id;
                    const assignedKid = kids.find(k => k.id === chore.assignedTo);
                    return isEditing ? (
                      <div key={chore.id} className="bento-card p-5 border-2 border-indigo-400 bg-indigo-50/10 text-left space-y-4">
                        <div className="flex items-center justify-between border-b pb-2 mb-2">
                          <h4 className="font-display font-black text-lg text-indigo-900">✏️ Edit Chore Template</h4>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingChoreId(null);
                              setEditChoreError("");
                            }}
                            className="p-1 hover:bg-indigo-150 rounded text-slate-400 cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Pick Preset Chore</label>
                            <select
                              value={editPresetKey}
                              onChange={(e) => handleEditPresetChange(e.target.value)}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-sans bg-white cursor-pointer focus:border-indigo-400 outline-hidden text-slate-700"
                            >
                              <option value="custom">✍️ Keep custom or type new...</option>
                              <optgroup label="🧹 Cleaning & Tidying">
                                <option value="clean_bedroom">Clean Bedroom 🧹 (30 pts)</option>
                                <option value="make_bed">Make Bed 🛏️ (10 pts)</option>
                                <option value="vacuum_living_room">Vacuum Living Room 🧹 (40 pts)</option>
                                <option value="mop_floors">Mop Floors 🧼 (50 pts)</option>
                                <option value="take_out_trash">Take out Trash 🗑️ (15 pts)</option>
                              </optgroup>
                              <optgroup label="🍽️ Kitchen & Meals">
                                <option value="wash_dishes">Wash Dishes 🍽️ (25 pts)</option>
                                <option value="clean_dining_table">Clean Dining Table 🧽 (15 pts)</option>
                                <option value="load_dishwasher">Load/Empty Dishwasher 🍽️ (20 pts)</option>
                              </optgroup>
                              <optgroup label="📚 Studies & Routines">
                                <option value="do_homework">Do Homework 📚 (25 pts)</option>
                                <option value="read_book">Read for 20 mins 📖 (20 pts)</option>
                                <option value="brush_teeth">Brush Teeth 🪥 (10 pts)</option>
                              </optgroup>
                              <optgroup label="🐾 Pets & Outdoors">
                                <option value="feed_pets">Feed Pets 🐕 (15 pts)</option>
                                <option value="water_plants">Water Plants 🌱 (15 pts)</option>
                                <option value="wash_car">Wash the Car 🚗 (80 pts)</option>
                              </optgroup>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Chore Title</label>
                            <input
                              type="text"
                              value={editChoreForm.name}
                              onChange={(e) => {
                                setEditPresetKey("custom");
                                setEditChoreForm(prev => ({ ...prev, name: e.target.value }));
                              }}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-sans text-slate-700"
                              placeholder="Chore Name"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Points (10-100)</label>
                              <input
                                type="number"
                                min={10}
                                max={100}
                                value={editChoreForm.points}
                                onChange={(e) => setEditChoreForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono text-center text-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Frequency</label>
                              <select
                                value={editChoreForm.frequency}
                                onChange={(e) => setEditChoreForm(prev => ({ ...prev, frequency: e.target.value as any }))}
                                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-sans bg-white cursor-pointer text-slate-700"
                              >
                                <option value="daily">Daily ☀️</option>
                                <option value="weekly">Weekly 🗓️</option>
                                <option value="one-time">One-time ⚡</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned To</label>
                            <select
                              value={editChoreForm.assignedTo}
                              onChange={(e) => setEditChoreForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-sans bg-white cursor-pointer text-slate-700"
                            >
                              <option value="all">🧒 All Kids (Separate Copies)</option>
                              <option value="parents">👨‍👩‍👧‍👦 Both Parents</option>
                              <optgroup label="🧒 Children Directory">
                                {kids.filter(k => !k.role || k.role === "kid").map(k => (
                                  <option key={k.id} value={k.id}>{k.name}</option>
                                ))}
                              </optgroup>
                              <optgroup label="💑 Spouses & Partners Directory">
                                {kids.filter(k => k.role === "spouse").map(k => (
                                  <option key={k.id} value={k.id}>{k.name}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          {editChoreError && <p className="text-rose-500 text-xs font-bold bg-rose-50 p-1.5 rounded border border-rose-100">{editChoreError}</p>}

                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChoreId(null);
                                setEditChoreError("");
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const { name, points, assignedTo, frequency } = editChoreForm;
                                if (!name.trim()) return setEditChoreError("Chore name is required!");
                                if (points < 10 || points > 100) return setEditChoreError("Points must be between 10 and 100!");
                                if (!assignedTo) return setEditChoreError("Please assign this chore to someone!");

                                onUpdateChore(chore.id, { name: name.trim(), points, assignedTo, frequency });
                                setEditingChoreId(null);
                                setEditChoreError("");
                              }}
                              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer font-sans"
                            >
                              <Check size={12} />
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        key={chore.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bento-card p-4 border-2 border-slate-100 flex items-center justify-between hover:border-slate-300 transition shadow-2xs"
                      >
                        <div className="space-y-1.5 text-left">
                          <h4 className="font-display font-bold text-lg text-slate-800">{chore.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-medium font-sans">
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                              ⭐ {chore.points} Points
                            </span>
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full capitalize">
                              🔄 {chore.frequency}
                            </span>
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                              👤 Assigned: {
                                chore.assignedTo === "all" ? "All Kids" :
                                chore.assignedTo === "parents" ? "👨‍👩‍👧‍👦 Both Parents" :
                                assignedKid ? `${assignedKid.role === "spouse" ? "💑" : "🧒"} ${assignedKid.name}` : 
                                "Unknown"
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingChoreId(chore.id);
                              setEditChoreForm({
                                name: chore.name,
                                points: chore.points,
                                assignedTo: chore.assignedTo,
                                frequency: chore.frequency
                              });
                              const matchingPresetKey = Object.keys(CHORE_PRESETS).find(
                                key => CHORE_PRESETS[key].name === chore.name
                              ) || "custom";
                              setEditPresetKey(matchingPresetKey);
                            }}
                            className="p-2.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 rounded-xl transition cursor-pointer"
                            title="Edit chore template"
                          >
                            <Edit2 size={18} />
                          </button>
                          {choreIdToDelete === chore.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                              <span className="text-[10px] font-bold text-rose-700 px-1">Delete?</span>
                              <button
                                onClick={() => {
                                  onDeleteChore(chore.id);
                                  setChoreIdToDelete(null);
                                }}
                                className="px-1.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-md transition cursor-pointer"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setChoreIdToDelete(null)}
                                className="px-1.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-md transition cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setChoreIdToDelete(chore.id)}
                              className="p-2.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition cursor-pointer"
                              title="Delete chore template"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REWARDS */}
        {activeTab === "rewards" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="bg-white p-6 rounded-3xl border-4 border-slate-100 shadow-xs h-fit">
              <h3 className="font-display font-bold text-xl text-slate-800 mb-4">Add Custom Reward</h3>
              
              <form onSubmit={handleCreateReward} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Reward Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Choose dinner menu 🍕"
                    value={rewardForm.name}
                    onChange={(e) => setRewardForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Points cost</label>
                    <input
                      type="number"
                      min={10}
                      value={rewardForm.pointsCost}
                      onChange={(e) => setRewardForm(prev => ({ ...prev, pointsCost: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Limit Quantity</label>
                    <select
                      value={rewardForm.quantity}
                      onChange={(e) => setRewardForm(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans bg-white cursor-pointer"
                    >
                      <option value="-1">Unlimited ♾️</option>
                      <option value="1">Only 1 Spot 🔒</option>
                      <option value="2">Exactly 2 Available 🎟️</option>
                      <option value="5">Exactly 5 Available 🏷️</option>
                    </select>
                  </div>
                </div>

                {rewardError && <p className="text-rose-500 text-xs font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{rewardError}</p>}

                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-display font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={18} />
                  Add to Reward Catalog
                </button>
              </form>

              <div className="border-t-2 border-slate-100 my-5 pt-5">
                <button
                  type="button"
                  onClick={() => { setAiRewardOpen(true); setAiSuggestedRewards([]); setAiErrorMsg(""); }}
                  className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-950 font-display font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer border border-yellow-500"
                >
                  <Sparkles size={16} />
                  ✨ Generate Reward Ideas with AI
                </button>
              </div>
            </div>

            {/* List */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-display font-bold text-xl text-slate-800">Catalog of Rewards</h3>

              {rewards.length === 0 ? (
                <div className="bento-card p-12 text-center text-slate-400">
                  <p className="font-display font-bold text-lg">Reward store is empty</p>
                  <p className="font-sans text-sm mt-1">Add rewards customly or click generate ideas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewards.map((reward) => (
                    <motion.div
                      key={reward.id}
                      layout
                      className="bento-card p-4 border-2 border-slate-100 flex flex-col justify-between hover:border-purple-200 transition shadow-2xs"
                    >
                      <div className="space-y-2 text-left mb-4">
                        <span className="inline-block bg-purple-100 text-purple-700 text-2xs font-extrabold uppercase Tracking-widest px-2 py-0.5 rounded-full">
                          {reward.quantity === -1 ? "♾️ Unlimited Use" : `🎟️ Limit Left: ${reward.quantity}`}
                        </span>
                        <h4 className="font-display font-bold text-lg text-slate-800">{reward.name}</h4>
                        <div className="text-xl font-mono font-black text-amber-500 flex items-center gap-1 mt-1">
                          🎁 {reward.pointsCost} <span className="text-xs text-slate-400 uppercase font-bold font-sans">pts cost</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteReward(reward.id)}
                        className="py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition font-sans font-bold text-xs rounded-lg flex items-center justify-center gap-1 pointer cursor-pointer"
                      >
                        <Trash2 size={13} />
                        Delete Reward Option
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: APPROVALS QUEUE */}
        {activeTab === "approvals" && (
          <div className="space-y-8">
            {/* Chores Completions Feed */}
            <div className="space-y-4">
              <h3 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2">
                🧹 Kids' Finished Chores (Needs Verification)
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {pending.filter(p => p.status === "pending").length} items
                </span>
              </h3>

              {pending.filter(p => p.status === "pending").length === 0 ? (
                <div className="bento-card p-8 text-center text-slate-400">
                  <p className="font-medium text-slate-500">Perfect! No chore validation requests left. 🎉</p>
                  <p className="text-xs text-slate-400 mt-0.5">Kids will see claims approved instantly once done.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.filter(p => p.status === "pending").map((pItem) => (
                    <motion.div
                      key={pItem.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bento-card p-4 border-2 border-emerald-100 bg-emerald-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="text-left space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-xs">
                            {pItem.kidName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {new Date(pItem.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="font-display font-bold text-lg text-slate-800">{pItem.choreName}</h4>
                        <div className="text-amber-600 font-mono text-sm font-bold flex items-center gap-1">
                          ⭐ Earns: {pItem.points} points
                        </div>
                      </div>

                      <div className="flex gap-2 self-end md:self-center">
                        <button
                          onClick={() => onApproveChore(pItem.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-display font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <Check size={14} />
                          Approve ({pItem.points} pts)
                        </button>
                        <button
                          onClick={() => onRejectChore(pItem.id)}
                          className="px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 font-display font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <X size={14} />
                          Reject
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Redemptions Feed */}
            <div className="space-y-4 pt-4 border-t-2 border-slate-100">
              <h3 className="font-display font-bold text-xl text-slate-800 flex items-center gap-2">
                🎁 Reward Redemption Requests (Confirmation needed)
                <span className="text-xs font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  {redemptions.filter(r => r.status === "pending").length} items
                </span>
              </h3>

              {redemptions.filter(r => r.status === "pending").length === 0 ? (
                <div className="bento-card p-8 text-center text-slate-400">
                  <p className="font-medium text-slate-500">No pending reward redemptions needing hand out. 🍿</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {redemptions.filter(r => r.status === "pending").map((rItem) => {
                    const kid = kids.find(k => k.id === rItem.kidId);
                    return (
                      <motion.div
                        key={rItem.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bento-card p-4 border-2 border-purple-100 bg-purple-50/20 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="text-left space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full text-xs">
                              {kid?.name || "Kid"}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {new Date(rItem.redeemedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <h4 className="font-display font-bold text-lg text-slate-800">Wishes to claim: <span className="text-purple-700">{rItem.rewardName}</span></h4>
                          <div className="text-slate-500 font-sans text-sm font-semibold">
                            🪙 Paid Cost: <span className="font-mono text-amber-500 font-black">{rItem.pointsCost} points</span>
                          </div>
                        </div>

                        <div className="flex gap-2 self-end md:self-center">
                          <button
                            onClick={() => onApproveRedemption(rItem.id)}
                            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-display font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                          >
                            <Check size={14} />
                            Fulfill (Hand Out!)
                          </button>
                          <button
                            onClick={() => onRejectRedemption(rItem.id)}
                            className="px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 font-display font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                            title="Reject request and refund youth wallet points"
                          >
                            <Trash2 size={14} />
                            Decline & Refund Points
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FAMILY PROFILES */}
        {activeTab === "kids" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Forms Column */}
            <div className="space-y-6">
              {/* Register Family Profile */}
              <div className="bg-white p-6 rounded-3xl border-4 border-slate-100 shadow-xs h-fit">
                <h3 className="font-display font-bold text-xl text-slate-800 mb-4">Register Family Profile</h3>
                
                <form onSubmit={handleCreateKid} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Leo 🦁 or Susan 💑"
                      value={kidForm.name}
                      onChange={(e) => setKidForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Role / Account Type</label>
                    <select
                      value={kidForm.role || "kid"}
                      onChange={(e) => setKidForm(prev => ({ ...prev, role: e.target.value as "kid" | "spouse" }))}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans bg-white cursor-pointer"
                    >
                      <option value="kid">👶 Child (Earns star coins for chores)</option>
                      <option value="spouse">💑 Spouse / Partner (Co-parent chores)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">4-Digit Login PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="e.g. 1234"
                      value={kidForm.pin}
                      onChange={(e) => setKidForm(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, "") }))}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans tracking-widest text-center"
                    />
                  </div>

                  {kidForm.role !== "spouse" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Daily TV/Screen Limit (Minutes)</label>
                      <input
                        type="number"
                        min={10}
                        max={480}
                        placeholder="e.g. 60"
                        value={kidForm.screenTimeLimitMinutes}
                        onChange={(e) => setKidForm(prev => ({ ...prev, screenTimeLimitMinutes: Math.max(1, parseInt(e.target.value) || 0) }))}
                        className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans font-bold"
                      />
                    </div>
                  )}

                  {kidError && <p className="text-rose-500 text-xs font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{kidError}</p>}

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-display font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus size={18} />
                    Add Family Profile
                  </button>
                </form>
              </div>

              {/* Parent Passcode Settings */}
              <div className="bg-white p-6 rounded-3xl border-4 border-slate-100 shadow-xs h-fit">
                <h3 className="font-display font-bold text-xl text-slate-800 mb-2 flex items-center gap-2">
                  🔒 Parent Passcode
                </h3>
                <p className="text-xs text-slate-500 mb-4 font-sans font-medium">
                  Update the passcode used to access the parent dashboard. (Current PIN: <span className="font-mono font-bold">{parentPin}</span>)
                </p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setParentPinError("");
                    setParentPinSuccess("");
                    if (!/^\d{4}$/.test(newParentPin)) {
                      setParentPinError("Passcode must be exactly 4 digits!");
                      return;
                    }
                    onUpdateParentPin(newParentPin);
                    setParentPinSuccess("Parent passcode updated successfully!");
                    setNewParentPin("");
                  }} 
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">New 4-Digit Passcode</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="e.g. 9999"
                      value={newParentPin}
                      onChange={(e) => setNewParentPin(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans tracking-widest text-center"
                    />
                  </div>
                  {parentPinError && <p className="text-rose-500 text-xs font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{parentPinError}</p>}
                  {parentPinSuccess && <p className="text-emerald-500 text-xs font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">{parentPinSuccess}</p>}
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-display font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Update Passcode
                  </button>
                </form>
              </div>
            </div>

            {/* Kids roster list */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-display font-bold text-xl text-slate-800">Family Member Directory</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kids.map((k) => {
                  const isEditing = editingKidId === k.id;
                  return isEditing ? (
                    <div key={k.id} className="bento-card p-5 border-2 border-indigo-400 bg-indigo-50/10 text-left space-y-4">
                      <div className="flex items-center justify-between border-b pb-2 mb-2">
                        <h4 className="font-display font-black text-lg text-indigo-900">✏️ Edit {k.name}'s Profile</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingKidId(null);
                            setEditKidError("");
                          }}
                          className="p-1 hover:bg-indigo-150 rounded text-slate-400 cursor-pointer"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-3xs font-bold text-indigo-700 uppercase tracking-wider mb-0.5">Edit Name</label>
                          <input
                            type="text"
                            value={editKidForm.name}
                            onChange={(e) => setEditKidForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-sans"
                            placeholder="Leo 🦁"
                          />
                        </div>

                        <div>
                          <label className="block text-3xs font-bold text-indigo-700 uppercase tracking-wider mb-0.5">Edit Role / Account Type</label>
                          <select
                            value={editKidForm.role || "kid"}
                            onChange={(e) => setEditKidForm(prev => ({ ...prev, role: e.target.value as "kid" | "spouse" }))}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-sans bg-white cursor-pointer"
                          >
                            <option value="kid">👶 Child</option>
                            <option value="spouse">💑 Spouse / Partner</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">4-Digit PIN</label>
                            <input
                              type="password"
                              maxLength={4}
                              value={editKidForm.pin}
                              onChange={(e) => setEditKidForm(prev => ({ ...prev, pin: e.target.value.replace(/\D/g, "") }))}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-mono tracking-widest text-slate-700"
                              placeholder="PIN"
                            />
                          </div>
                          <div>
                            <label className="block text-3xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Points Balance</label>
                            <input
                              type="number"
                              min={0}
                              value={editKidForm.points}
                              onChange={(e) => setEditKidForm(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-mono font-bold text-slate-700"
                            />
                          </div>
                        </div>

                        {editKidForm.role !== "spouse" && (
                          <div>
                            <label className="block text-3xs font-bold text-indigo-700 uppercase tracking-wider mb-0.5">Daily TV/Screen Limit (Minutes)</label>
                            <input
                              type="number"
                              min={10}
                              max={480}
                              value={editKidForm.screenTimeLimitMinutes || 60}
                              onChange={(e) => setEditKidForm(prev => ({ ...prev, screenTimeLimitMinutes: Math.max(1, parseInt(e.target.value) || 0) }))}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center font-mono font-bold text-slate-700"
                            />
                          </div>
                        )}

                        {editKidError && <p className="text-rose-500 text-2xs font-bold bg-rose-50 p-1.5 rounded border border-rose-100 leading-tight">{editKidError}</p>}

                        <div className="flex items-center justify-between pt-2 border-t gap-2">
                          {kidIdToDelete === k.id ? (
                            <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-left space-y-1.5 max-w-[180px]">
                              <p className="text-[10px] font-bold text-rose-700 leading-tight">Confirm deletion? All points will be wiped.</p>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteKid(k.id);
                                    setEditingKidId(null);
                                    setKidIdToDelete(null);
                                  }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-md transition cursor-pointer"
                                >
                                  Yes, Wipe
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setKidIdToDelete(null)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded-md transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setKidIdToDelete(k.id);
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200 text-xxs font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Trash2 size={12} />
                              Delete Profile
                            </button>
                          )}

                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingKidId(null);
                                setEditKidError("");
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const { name, pin, points, role, screenTimeLimitMinutes } = editKidForm;
                                if (!name.trim()) return setEditKidError("Name cannot be empty!");
                                if (!/^\d{4}$/.test(pin)) return setEditKidError("PIN must be 4 numbers!");
                                if (points < 0) return setEditKidError("Points cannot be negative!");
                                
                                onUpdateKid(k.id, name.trim(), pin, points, role, role === "spouse" ? undefined : screenTimeLimitMinutes);
                                setEditingKidId(null);
                                setEditKidError("");
                              }}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer font-sans"
                            >
                              <Check size={12} />
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={k.id}
                      className={`bento-card p-5 border-2 hover:border-indigo-200 transition-all ${selectedKidHistoryId === k.id ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-100'}`}
                    >
                      <div className="flex items-center justify-between text-left">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-display font-extrabold text-xl text-indigo-950 flex items-center gap-1">
                              {k.role === 'spouse' ? '💑' : '🧒'} {k.name}
                            </h4>
                            <span className={`text-[10px] font-sans font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-full ${k.role === 'spouse' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                              {k.role === 'spouse' ? 'Spouse' : 'Kid'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-sans font-medium mt-1">PIN Code secret: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-600">{k.pin}</span></p>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-mono font-black text-amber-500">🏆 {k.points} <span className="text-xs uppercase font-sans font-bold text-slate-400">pts</span></div>
                          <div className="text-xs text-slate-400 mt-1 font-semibold">{k.role === 'spouse' ? 'Duty Credits' : `Total Earned: ${k.totalEarned} pts`}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t-2 border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setSelectedKidHistoryId(k.id === selectedKidHistoryId ? "" : k.id)}
                          className="text-xs font-sans font-bold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1 cursor-pointer"
                        >
                          <History size={13} />
                          {selectedKidHistoryId === k.id ? "Close Log History" : "View Finished Log History"}
                        </button>

                        <button
                          onClick={() => {
                            setEditingKidId(k.id);
                            setEditKidForm({ name: k.name, pin: k.pin, points: k.points, role: k.role || "kid", screenTimeLimitMinutes: k.screenTimeLimitMinutes || 60 });
                            setEditKidError("");
                          }}
                          className="text-xs font-sans font-bold text-slate-500 hover:text-indigo-600 transition flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-slate-150"
                        >
                          <Edit2 size={12} />
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Kid specific completed chores history log */}
              <AnimatePresence>
                {selectedKidHistoryId && (() => {
                  const targetKid = kids.find(k => k.id === selectedKidHistoryId);
                  const kidsCompletedChores = pending.filter(p => p.kidId === selectedKidHistoryId && p.status === "approved");
                  const kidsRedemptions = redemptions.filter(r => r.kidId === selectedKidHistoryId && r.status === "approved");
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-indigo-50/35 border-3 border-indigo-100 rounded-3xl p-6 text-left space-y-4 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-display font-bold text-lg text-indigo-900">
                          📜 {targetKid?.name}'s Full Accomplishment Log
                        </h4>
                        <button 
                          onClick={() => setSelectedKidHistoryId("")}
                          className="p-1 hover:bg-indigo-100 text-indigo-900 rounded-full cursor-pointer"
                        >
                          <X size={18} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Completed chores log panel */}
                        <div className="space-y-2 bg-white/70 p-4 rounded-2xl border-2 border-slate-100">
                          <h5 className="font-display font-extrabold text-sm text-slate-600 uppercase tracking-wide">Approved Cleanups ({kidsCompletedChores.length})</h5>
                          
                          {kidsCompletedChores.length === 0 ? (
                            <p className="text-xs font-sans text-slate-400 py-3">No finished chore records registered.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                              {kidsCompletedChores.map(c => (
                                <div key={c.id} className="text-xs flex items-center justify-between border-b border-slate-100 py-1 font-sans">
                                  <span className="text-slate-700 capitalize font-medium">{c.choreName}</span>
                                  <span className="font-mono text-emerald-600 font-bold">+{c.points} pts</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Redeemed rewards log panel */}
                        <div className="space-y-2 bg-white/70 p-4 rounded-2xl border-2 border-slate-100">
                          <h5 className="font-display font-extrabold text-sm text-slate-600 uppercase tracking-wide">Redeemed Treats ({kidsRedemptions.length})</h5>
                          
                          {kidsRedemptions.length === 0 ? (
                            <p className="text-xs font-sans text-slate-400 py-3">No reward transactions fulfilled.</p>
                          ) : (
                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                              {kidsRedemptions.map(r => (
                                <div key={r.id} className="text-xs flex items-center justify-between border-b border-slate-100 py-1 font-sans">
                                  <span className="text-indigo-700 capitalize font-medium">{r.rewardName}</span>
                                  <span className="font-mono text-slate-500">-{r.pointsCost} pts</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

            </div>
          </div>
        )}

        {/* TAB 5: TV TIME LOGS */}
        {activeTab === "tv" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column */}
            <div className="bg-white p-6 rounded-3xl border-4 border-slate-100 shadow-xs h-fit text-left">
              <h3 className="font-display font-bold text-xl text-slate-800 mb-2 flex items-center gap-2">
                📺 Log TV & Screen Interval
              </h3>
              <p className="text-xs text-slate-500 mb-4 font-sans font-medium">
                Record a specific watch interval for your child. It will automatically consolidate into their daily total.
              </p>
              
              <form onSubmit={handleLogTvSession} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Select Child</label>
                  <select
                    value={tvForm.kidId}
                    onChange={(e) => setTvForm(prev => ({ ...prev, kidId: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans bg-white cursor-pointer"
                  >
                    <option value="">-- Choose family member --</option>
                    {kids.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Date</label>
                  <input
                    type="date"
                    value={tvForm.date}
                    onChange={(e) => setTvForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Duration (Minutes)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      max={480}
                      value={tvForm.durationMinutes}
                      onChange={(e) => setTvForm(prev => ({ ...prev, durationMinutes: Math.max(1, parseInt(e.target.value) || 0) }))}
                      className="w-24 px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans font-mono text-center"
                    />
                    {/* Presets */}
                    <div className="flex-1 grid grid-cols-4 gap-1.5">
                      {[15, 30, 45, 60].map(mins => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setTvForm(prev => ({ ...prev, durationMinutes: mins }))}
                          className={`py-2 text-xs font-bold rounded-lg border transition ${tvForm.durationMinutes === mins ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'} cursor-pointer`}
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">What did they watch? (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Cartoon movie, gaming session, YouTube"
                    value={tvForm.notes}
                    onChange={(e) => setTvForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl outline-hidden text-slate-700 font-sans"
                  />
                </div>

                {tvError && <p className="text-rose-500 text-xs font-bold bg-rose-50 p-2 rounded-lg border border-rose-100">{tvError}</p>}
                {tvSuccess && <p className="text-emerald-500 text-xs font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">{tvSuccess}</p>}

                <button
                  type="submit"
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-display font-extrabold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={18} />
                  Record Interval
                </button>
              </form>
            </div>

            {/* Daily Consolidation Column */}
            <div className="lg:col-span-2 space-y-6 text-left">
              {/* Daily view picker */}
              <div className="bg-white p-6 rounded-3xl border-4 border-slate-100 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
                  <div>
                    <h3 className="font-display font-black text-xl text-slate-800 flex items-center gap-2">
                      📊 Consolidated Daily Report
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      View and manage total screen time logged by day.
                    </p>
                  </div>
                  <input
                    type="date"
                    value={tvForm.date}
                    onChange={(e) => setTvForm(prev => ({ ...prev, date: e.target.value }))}
                    className="px-3 py-1.5 border-2 border-slate-200 focus:border-indigo-400 rounded-xl text-sm font-sans outline-hidden bg-slate-50 text-slate-700"
                  />
                </div>

                {/* Consolidated List per Kid */}
                {kids.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 font-medium">
                    Please create a family profile first!
                  </div>
                ) : (
                  <div className="space-y-6">
                    {kids.map(kid => {
                      // Get all sessions for this kid on this date
                      const sessions = tvSessions.filter(s => s.kidId === kid.id && s.date === tvForm.date);
                      const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
                      const limitMinutes = kid.screenTimeLimitMinutes ?? 60; // default screen time guideline
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

                      return (
                        <div key={kid.id} className={`p-4 rounded-2xl border-2 ${bgFill} ${borderStyle} transition-all`}>
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <span className="font-display font-extrabold text-lg text-slate-800">{kid.name}</span>
                              <span className="text-3xs tracking-widest uppercase font-sans font-black bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-500 ml-2">
                                Guideline: {limitMinutes}m
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={`text-xl font-mono font-black ${textColor}`}>{totalMinutes}</span>
                              <span className="text-xs text-slate-400 uppercase font-sans font-bold ml-1">mins</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-white rounded-full h-3.5 overflow-hidden border border-slate-200">
                            <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                          </div>

                          {totalMinutes > limitMinutes && (() => {
                            const excessMinutes = totalMinutes - limitMinutes;
                            const penaltyPoints = Math.floor(excessMinutes / 30) * 5;
                            return (
                              <div className="mt-1.5 space-y-1">
                                <p className={`text-3xs font-extrabold uppercase tracking-wider ${textColor} flex items-center gap-1`}>
                                  ⚠️ Guideline limit exceeded ({excessMinutes}m over target)
                                </p>
                                {penaltyPoints > 0 ? (
                                  <p className="text-3xs font-black uppercase tracking-wider text-rose-600 bg-rose-100/50 px-2 py-0.5 rounded-md w-fit border border-rose-200">
                                    🚨 Point Deduction: -{penaltyPoints} points (-5 points for every 30m exceeded)
                                  </p>
                                ) : (
                                  <p className="text-3xs font-bold uppercase tracking-wider text-slate-500">
                                    ℹ️ Next 30m over will trigger a -5 points deduction
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          {/* Individual Interval Logs list */}
                          <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-3xs font-black uppercase tracking-wider text-slate-400">Watch Interval History ({sessions.length})</h5>
                              {sessions.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to clear all ${sessions.length} recorded TV logs for ${kid.name} on this date?`)) {
                                      sessions.forEach(s => onDeleteTvSession(s.id));
                                    }
                                  }}
                                  className="text-xxs font-sans font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-100 transition cursor-pointer"
                                >
                                  Clear All Logs
                                </button>
                              )}
                            </div>
                            {sessions.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No watch sessions recorded for this day.</p>
                            ) : (
                              <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                                {sessions.map(s => (
                                  <div key={s.id} className="bg-white/80 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2 text-xs">
                                    <div className="flex-1 flex flex-wrap items-center gap-x-2">
                                      <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md text-xxs">
                                        {s.durationMinutes}m
                                      </span>
                                      {s.notes && <span className="text-slate-600 font-sans font-medium">"{s.notes}"</span>}
                                      <span className="text-3xs text-slate-400 font-semibold font-sans">
                                        (Logged: {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteTvSession(s.id)}
                                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition cursor-pointer"
                                      title="Delete Session Entry"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Screen guidelines informational box */}
              <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border-4 border-slate-800 shadow-md">
                <h4 className="font-display font-extrabold text-lg text-amber-400 flex items-center gap-2 mb-2">
                  💡 Screen Time Recommendations
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                  According to pediatric guidelines, <strong>60 minutes of high-quality screen media</strong> is a healthy daily limit for kids ages 5–12. Setting custom time-slots can encourage balance, visual rest, and make screen time a fun reward for completed tasks!
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: AI SUGGEST CHORES */}
      <AnimatePresence>
        {aiChoreOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full border-4 border-yellow-200 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                <h3 className="font-display font-extrabold text-2xl text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="text-yellow-500 fill-yellow-400 animate-pulse" /> 
                  AI Chore Assistant
                </h3>
                <button onClick={() => setAiChoreOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <X size={22} className="text-slate-400" />
                </button>
              </div>

              {/* Setup age parameters */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                <p className="font-sans font-medium text-amber-900 text-sm mb-3">
                  Our intelligence is trained to output chores scaled appropriately to kids' developmental phases!
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-amber-700 mb-1 uppercase">Target Child Age</label>
                    <input
                      type="range"
                      min={4}
                      max={16}
                      value={aiAge}
                      onChange={(e) => setAiAge(parseInt(e.target.value))}
                      className="w-full accent-yellow-500"
                    />
                  </div>
                  <div className="w-16 h-16 bg-white border-2 border-amber-300 rounded-2xl flex flex-col items-center justify-center font-display font-black text-amber-900 shadow-3xs">
                    <span className="text-2xl leading-none">{aiAge}</span>
                    <span className="text-3xs tracking-widest uppercase">yrs</span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleQueryAIChores}
                    disabled={aiLoading}
                    className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-amber-200 text-yellow-950 font-display font-extrabold rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Consulting Gemini brain...
                      </>
                    ) : (
                      "🚀 Generate Recommendations"
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestion output results */}
              <div className="space-y-4">
                {aiErrorMsg && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <p className="font-bold text-sm">Operation Blocked by Key Configuration</p>
                      <p className="text-xs font-sans mt-0.5">{aiErrorMsg}</p>
                    </div>
                  </div>
                )}

                {aiSuggestedChores.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-display font-extrabold text-lg text-slate-800">Age-Appropriate Cleanups</h4>
                    
                    {aiSuggestedChores.map((item, id) => (
                      <div key={id} className="bento-card border border-neutral-100 p-3 flex items-center justify-between hover:bg-slate-50 transition gap-4">
                        <div className="text-left space-y-0.5">
                          <h5 className="font-display font-bold text-base text-slate-800 flex items-center gap-1.5">
                            {item.name}
                            <span className="bg-yellow-100 border border-yellow-250 text-yellow-800 text-4xs font-black px-1.5 py-0.5 rounded-full font-sans">
                              ⭐ {item.points} pts
                            </span>
                          </h5>
                          <p className="text-xs text-slate-500 font-sans leading-relaxed">{item.description}</p>
                        </div>

                        <div className="shrink-0">
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const kidId = e.target.value;
                              if (kidId) addAISuggestedChore(item, kidId);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-display font-bold text-xs rounded-lg px-2.5 py-1.5 outline-hidden border border-indigo-700 cursor-pointer text-center"
                          >
                            <option value="">➕ Add Chore</option>
                            <option value="all">Assign: All Kids</option>
                            {kids.map(k => (
                              <option key={k.id} value={k.id}>Assign: {k.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: AI SUGGEST REWARDS */}
      <AnimatePresence>
        {aiRewardOpen && (
          <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-2xl w-full border-4 border-yellow-200 shadow-2xl space-y-6 text-left max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
                <h3 className="font-display font-extrabold text-2xl text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="text-yellow-500 fill-yellow-400" /> 
                  AI Reward Strategist
                </h3>
                <button onClick={() => setAiRewardOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                  <X size={22} className="text-slate-400" />
                </button>
              </div>

              {/* Age Parameters slider */}
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                <p className="font-sans font-medium text-amber-900 text-sm mb-3">
                  Brainstorm wholesome incentives children adore without resorting to monetary handouts!
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-amber-700 mb-1 uppercase">Target Child Age</label>
                    <input
                      type="range"
                      min={4}
                      max={16}
                      value={aiAge}
                      onChange={(e) => setAiAge(parseInt(e.target.value))}
                      className="w-full accent-yellow-500"
                    />
                  </div>
                  <div className="w-16 h-16 bg-white border-2 border-amber-300 rounded-2xl flex flex-col items-center justify-center font-display font-black text-amber-900 shadow-3xs">
                    <span className="text-2xl leading-none">{aiAge}</span>
                    <span className="text-3xs tracking-widest uppercase">yrs</span>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={handleQueryAIRewards}
                    disabled={aiLoading}
                    className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-500 disabled:bg-amber-200 text-yellow-950 font-display font-extrabold rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Generating rewards catalog ...
                      </>
                    ) : (
                      "🚀 Generate Incentives"
                    )}
                  </button>
                </div>
              </div>

              {/* Suggestions list */}
              <div className="space-y-4">
                {aiErrorMsg && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5 text-rose-500" />
                    <div>
                      <p className="font-bold text-sm">Operation Blocked by Key Configuration</p>
                      <p className="text-xs font-sans mt-0.5">{aiErrorMsg}</p>
                    </div>
                  </div>
                )}

                {aiSuggestedRewards.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-display font-extrabold text-lg text-slate-800">Clever Reward Incentives</h4>
                    
                    {aiSuggestedRewards.map((item, id) => (
                      <div key={id} className="bento-card border border-neutral-100 p-3 flex items-center justify-between hover:bg-slate-50 transition gap-4">
                        <div className="text-left space-y-0.5">
                          <h5 className="font-display font-bold text-base text-slate-800 flex items-center gap-1.5">
                            {item.name}
                            <span className="bg-purple-100 border border-purple-200 text-purple-800 text-4xs font-black px-1.5 py-0.5 rounded-full font-sans">
                              🎁 {item.suggestedPoints} pts cost
                            </span>
                          </h5>
                          <p className="text-xs text-slate-500 font-sans leading-relaxed">{item.description}</p>
                        </div>

                        <button
                          onClick={() => addAISuggestedReward(item)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-display font-extrabold text-xs rounded-xl flex items-center gap-1 select-none pointer shrink-0 cursor-pointer border border-purple-700 shadow-3xs"
                        >
                          ➕ Add Reward
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
