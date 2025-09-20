import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 hover:shadow-lg neon-glow transform-gpu",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:scale-105 hover:shadow-lg",
        outline: "border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/40 hover:scale-105 glass-card hover:neon-glow",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105 hover:shadow-lg cyber-glow transform-gpu",
        ghost: "hover:bg-primary/10 hover:text-primary hover:scale-105 glass-card hover:backdrop-blur-md",
        link: "text-primary underline-offset-4 hover:underline text-glow hover:text-primary-glow",
        premium: "bg-gradient-electric hover:bg-gradient-neon text-primary-foreground font-orbitron font-bold neon-glow hover:scale-110 hover:shadow-xl transform-gpu relative overflow-hidden",
        glass: "glass-card text-foreground hover:neon-glow border-glass-border backdrop-blur-lg hover:backdrop-blur-xl",
        success: "bg-green-500 hover:bg-green-600 text-white hover:scale-105 hover:shadow-lg transform-gpu",
        warning: "bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-105 hover:shadow-lg transform-gpu",
        cyber: "bg-gradient-cyber hover:shadow-cyber text-primary-foreground font-medium hover:scale-105 transform-gpu animate-cyber-pulse",
        hero: "bg-gradient-electric hover:bg-gradient-neon text-primary-foreground font-bold text-lg px-8 py-4 rounded-xl neon-glow hover:scale-110 hover:shadow-2xl transform-gpu relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-1000",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
