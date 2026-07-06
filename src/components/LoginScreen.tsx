import React, { useState, useEffect } from "react";
import { Kid } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Sparkles, Delete } from "lucide-react";

interface LoginScreenProps {
  kids: Kid[];
  parentPin?: string;
  onLoginAsParent: () => void;
  onLoginAsKid: (kid: Kid) => void;
}

export default function LoginScreen({ kids, parentPin = "0000", onLoginAsParent, onLoginAsKid }: LoginScreenProps) {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string>("");

  const ADULT_PIN = parentPin;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError("");
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handlePinSubmit = (currentPin: string) => {
    if (currentPin === ADULT_PIN) {
      onLoginAsParent();
      return;
    }

    const matchedKid = kids.find(k => k.pin === currentPin);
    if (matchedKid) {
      onLoginAsKid(matchedKid);
      return;
    }

    setError("Invalid passcode. Please try again! (Default parent PIN is 0000)");
    setPin("");
  };

  // Submit automatically when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      const timer = setTimeout(() => {
        handlePinSubmit(pin);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  // Listen to physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape" || e.key === "Delete") {
        handleClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [pin]);

  return (
    <div id="login-container" className="min-h-[90vh] flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      
      {/* Brand Header */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="text-center mb-8"
      >
        <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wider px-3.5 py-1 rounded-full uppercase mb-3.5 shadow-3xs">
          <Sparkles size={12} className="animate-pulse" />
          ChoreQuest Adventure
        </span>
        <h1 className="font-display font-black text-4xl text-slate-800 tracking-tight flex items-center justify-center gap-2 drop-shadow-3xs">
          ChoreQuest <span className="animate-bounce-gentle inline-block">🏆</span>
        </h1>
        <p className="text-slate-500 mt-2 font-sans font-medium text-sm">
          Where household contributions unlock legendary rewards!
        </p>
      </motion.div>

      {/* Main Lock Screen Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="w-full bg-white p-8 rounded-3xl border-4 border-indigo-50/80 shadow-lg space-y-6 text-center"
      >
        <div className="flex flex-col items-center space-y-1">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl mb-1.5 animate-pulse-slow">
            <Lock size={26} />
          </div>
          <h2 className="font-display font-black text-2xl text-slate-800">
            Enter Passcode
          </h2>
          <p className="text-xs text-slate-400 font-sans max-w-xs leading-normal">
            Enter your 4-digit PIN code to access your family quest dashboard.
          </p>
        </div>

        {/* PIN Display (Dots) */}
        <div className="flex justify-center gap-4.5 py-2.5">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-6 h-6 rounded-full border-3 transition-all duration-150 ${
                pin.length > index
                  ? "bg-indigo-600 border-indigo-600 scale-110 shadow-sm"
                  : "border-slate-200 bg-slate-50/50"
              }`}
            />
          ))}
        </div>

        {/* Error Notification */}
        <div className="h-7 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-center text-2xs text-rose-600 font-extrabold bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 leading-tight"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-100 hover:border-slate-200 text-slate-800 font-display font-black text-2xl flex items-center justify-center transition-all duration-100 active:scale-90 cursor-pointer shadow-3xs"
            >
              {num}
            </button>
          ))}
          
          {/* Backspace */}
          <button
            onClick={handleBackspace}
            className="w-16 h-16 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-100 text-amber-700 font-sans flex items-center justify-center transition-all duration-100 active:scale-90 cursor-pointer shadow-3xs"
            title="Backspace"
          >
            <Delete size={20} />
          </button>

          {/* Number 0 */}
          <button
            onClick={() => handleKeyPress("0")}
            className="w-16 h-16 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border-2 border-slate-100 hover:border-slate-200 text-slate-800 font-display font-black text-2xl flex items-center justify-center transition-all duration-100 active:scale-90 cursor-pointer shadow-3xs"
          >
            0
          </button>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="w-16 h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-sans font-bold text-xs flex items-center justify-center transition-all duration-100 active:scale-90 cursor-pointer border border-slate-200 shadow-3xs uppercase tracking-wider"
            title="Clear all"
          >
            Clear
          </button>
        </div>

        {/* Footer info/hint */}
        <div className="text-[10px] text-slate-400 border-t pt-4 font-mono">
          🔑 Default Parent PIN is <span className="font-extrabold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100">0000</span>
        </div>
      </motion.div>

    </div>
  );
}
