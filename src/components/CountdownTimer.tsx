"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Clock } from "lucide-react";

interface CountdownTimerProps {
  expirationTime: string; // ISO string
  onTimeout: () => void;
}

export default function CountdownTimer({ expirationTime, onTimeout }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(900); // 15 mins default in seconds

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(expirationTime) - +new Date();
      if (difference <= 0) {
        setTimeLeft(0);
        onTimeout();
        return false;
      }
      setTimeLeft(Math.floor(difference / 1000));
      return true;
    };

    calculateTimeLeft();
    const timer = setInterval(() => {
      const active = calculateTimeLeft();
      if (!active) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expirationTime, onTimeout]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Calculate percentage of 15 minutes
  const totalDuration = 15 * 60; // 900 seconds
  const percentRemaining = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));

  // Determine warning levels
  let colorClass = "text-teal-600 border-teal-200 bg-teal-50";
  let progressClass = "bg-teal-500 animate-pulse";
  let textLabelClass = "text-teal-800";

  if (timeLeft <= 120) {
    colorClass = "text-red-600 border-red-200 bg-red-50 animate-bounce";
    progressClass = "bg-red-500 animate-ping";
    textLabelClass = "text-red-800 font-bold";
  } else if (timeLeft <= 300) {
    colorClass = "text-amber-600 border-amber-200 bg-amber-50";
    progressClass = "bg-amber-500";
    textLabelClass = "text-amber-800";
  }

  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-3 transition-all duration-300 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <span className={`text-sm font-medium ${textLabelClass}`}>
            Tiempo para completar el pago de tu seña
          </span>
        </div>
        <span className="text-xl font-mono font-bold tracking-wider">{formattedTime}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${progressClass}`} 
          style={{ width: `${percentRemaining}%` }}
        />
      </div>

      {timeLeft <= 120 && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 animate-pulse">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>¡Apúrate! El turno se liberará en menos de 2 minutos si no se detecta el pago.</span>
        </div>
      )}
    </div>
  );
}
