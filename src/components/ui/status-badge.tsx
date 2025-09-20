import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface StatusBadgeProps {
  status: "online" | "offline" | "charging" | "driving" | "idle" | "error";
  className?: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  animated = true,
  size = "md"
}) => {
  const statusConfig = {
    online: {
      text: "Tilkoblet",
      color: "bg-green-500 text-white",
      glow: "shadow-green-500/50",
      animation: "animate-pulse-neon"
    },
    offline: {
      text: "Frakoblet", 
      color: "bg-gray-500 text-white",
      glow: "shadow-gray-500/50",
      animation: ""
    },
    charging: {
      text: "Lader",
      color: "bg-blue-500 text-white",
      glow: "shadow-blue-500/50", 
      animation: "animate-pulse"
    },
    driving: {
      text: "Kjører",
      color: "bg-primary text-primary-foreground",
      glow: "neon-glow",
      animation: "animate-pulse-neon"
    },
    idle: {
      text: "Parkert",
      color: "bg-yellow-500 text-white",
      glow: "shadow-yellow-500/50",
      animation: "animate-bounce-soft"
    },
    error: {
      text: "Feil",
      color: "bg-red-500 text-white",
      glow: "shadow-red-500/50",
      animation: "animate-pulse"
    }
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2"
  };

  const config = statusConfig[status];

  return (
    <Badge
      className={cn(
        "font-medium border-0 relative",
        config.color,
        config.glow,
        sizeClasses[size],
        animated && config.animation,
        className
      )}
    >
      <div className={cn(
        "w-2 h-2 rounded-full mr-2",
        config.color.split(' ')[0],
        animated && "animate-ping absolute left-1"
      )} />
      <div className={cn(
        "w-2 h-2 rounded-full mr-2 relative",
        config.color.split(' ')[0]
      )} />
      {config.text}
    </Badge>
  );
};