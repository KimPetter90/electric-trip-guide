import React from "react";
import { cn } from "@/lib/utils";
import { Loader2, Zap } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "neon" | "pulse";
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "default",
  className,
  text
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  const variants = {
    default: "text-primary animate-spin",
    neon: "text-primary animate-spin neon-glow",
    pulse: "text-primary animate-pulse-neon"
  };

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div className="relative">
          <Zap className={cn(sizeClasses[size], "animate-pulse-neon")} />
          <div className="absolute inset-0 animate-ping">
            <Zap className={cn(sizeClasses[size], "text-primary/30")} />
          </div>
        </div>
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Loader2 className={cn(sizeClasses[size], variants[variant])} />
      {text && (
        <p className="text-sm text-muted-foreground animate-fade-in">{text}</p>
      )}
    </div>
  );
};