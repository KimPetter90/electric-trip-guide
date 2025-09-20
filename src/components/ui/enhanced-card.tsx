import React from "react";
import { cn } from "@/lib/utils";

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "glass" | "neon" | "cyber" | "premium";
  hover?: boolean;
  animated?: boolean;
  onClick?: () => void;
}

export const EnhancedCard: React.FC<EnhancedCardProps> = ({
  children,
  className,
  variant = "default",
  hover = true,
  animated = true,
  onClick
}) => {
  const variants = {
    default: "bg-card text-card-foreground border border-border",
    glass: "glass-card text-foreground border-glass-border",
    neon: "bg-card/80 text-card-foreground border-2 border-primary/30 neon-glow",
    cyber: "bg-gradient-glass text-foreground border border-secondary cyber-glow",
    premium: "bg-gradient-electric text-primary-foreground border-2 border-primary"
  };

  const hoverEffects = hover ? {
    default: "hover:shadow-lg hover:border-primary/20",
    glass: "hover:backdrop-blur-xl hover:border-primary/40",
    neon: "hover:border-primary/60 hover:shadow-neon",
    cyber: "hover:shadow-cyber hover:scale-105",
    premium: "hover:shadow-xl hover:scale-105"
  } : {};

  const animations = animated ? "transition-all duration-300 ease-out" : "";

  return (
    <div
      className={cn(
        "rounded-xl p-6",
        variants[variant],
        hoverEffects[variant] || "",
        animations,
        onClick && "cursor-pointer active:scale-95",
        animated && "animate-fade-in-up",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};