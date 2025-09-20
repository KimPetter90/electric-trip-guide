import React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  variant?: "default" | "neon" | "gradient" | "charging";
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  variant = "default",
  size = "md",
  showValue = false,
  animated = true
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  };

  const variants = {
    default: {
      container: "bg-muted",
      fill: "bg-primary"
    },
    neon: {
      container: "bg-muted border border-primary/20",
      fill: "bg-primary neon-glow"
    },
    gradient: {
      container: "bg-muted/50 backdrop-blur-sm",
      fill: "bg-gradient-electric"
    },
    charging: {
      container: "bg-muted/50 backdrop-blur-sm border border-green-500/20",
      fill: "bg-gradient-to-r from-green-400 to-green-600 neon-glow"
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative rounded-full overflow-hidden",
          sizeClasses[size],
          variants[variant].container
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out relative",
            variants[variant].fill,
            animated && percentage > 0 && "animate-progress-fill"
          )}
          style={{ width: `${percentage}%` }}
        >
          {variant === "charging" && animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-energy-flow" />
          )}
        </div>
        
        {animated && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-progress-bar opacity-50"
            style={{ animationDelay: "0.5s" }}
          />
        )}
      </div>
      
      {showValue && (
        <div className="flex justify-between items-center mt-2 text-sm">
          <span className="text-muted-foreground">
            {Math.round(value)}{max === 100 ? "%" : ` / ${max}`}
          </span>
          {variant === "charging" && (
            <span className="text-green-500 font-medium animate-pulse">
              Lader...
            </span>
          )}
        </div>
      )}
    </div>
  );
};