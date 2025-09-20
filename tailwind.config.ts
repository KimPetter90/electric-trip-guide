import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'exo': ['Exo 2', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
          neon: "hsl(var(--primary-neon))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          glow: "hsl(var(--secondary-glow))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          glow: "hsl(var(--accent-glow))",
        },
        glass: {
          bg: "hsl(var(--glass-bg))",
          border: "hsl(var(--glass-border))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        'gradient-electric': 'var(--gradient-electric)',
        'gradient-eco': 'var(--gradient-eco)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-neon': 'var(--gradient-neon)',
        'gradient-cyber': 'var(--gradient-cyber)',
        'gradient-premium': 'var(--gradient-premium)',
        'gradient-glass': 'var(--gradient-glass)',
      },
      boxShadow: {
        'electric': 'var(--shadow-electric)',
        'glow': 'var(--shadow-glow)',
        'neon': 'var(--shadow-neon)',
        'cyber': 'var(--shadow-cyber)',
        'glass': 'var(--glass-shadow)',
      },
      keyframes: {
        // Enhanced neon effects
        "pulse-neon": {
          "0%, 100%": { 
            boxShadow: "0 0 5px hsl(140 100% 55%), 0 0 10px hsl(140 100% 55%), 0 0 15px hsl(140 100% 55%)",
            opacity: "1"
          },
          "50%": { 
            boxShadow: "0 0 10px hsl(140 100% 55%), 0 0 20px hsl(140 100% 55%), 0 0 30px hsl(140 100% 55%)",
            opacity: "0.8"
          }
        },
        
        // Improved float animations
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "float-delayed": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-8px) rotate(1deg)" },
          "66%": { transform: "translateY(-3px) rotate(-1deg)" }
        },
        
        // Enhanced glow effects
        "glow-pulse": {
          "0%, 100%": { 
            filter: "brightness(1) drop-shadow(0 0 10px hsl(140 100% 45%))"
          },
          "50%": { 
            filter: "brightness(1.2) drop-shadow(0 0 20px hsl(140 100% 45%))"
          }
        },
        "cyber-pulse": {
          "0%, 100%": { 
            boxShadow: "0 0 10px hsl(180 100% 50%), 0 0 20px hsl(280 100% 50%)"
          },
          "50%": { 
            boxShadow: "0 0 20px hsl(180 100% 50%), 0 0 40px hsl(280 100% 50%)"
          }
        },
        
        // Circuit and energy animations
        "circuit": {
          "0%": { 
            backgroundPosition: "0% 0%",
            opacity: "0.3"
          },
          "50%": {
            backgroundPosition: "100% 100%", 
            opacity: "0.6"
          },
          "100%": { 
            backgroundPosition: "0% 0%",
            opacity: "0.3"
          }
        },
        "energy-flow": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" }
        },
        
        // Smooth entrance animations
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(30px) scale(0.95)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) scale(1)"
          }
        },
        "slide-in-right": {
          "0%": {
            opacity: "0",
            transform: "translateX(30px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)"
          }
        },
        "slide-in-left": {
          "0%": {
            opacity: "0",
            transform: "translateX(-30px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateX(0)"
          }
        },
        
        // Scale and zoom effects
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)"
          }
        },
        "zoom-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.8) rotate(-5deg)"
          },
          "100%": {
            opacity: "1",
            transform: "scale(1) rotate(0deg)"
          }
        },
        
        // Interactive hover animations
        "bounce-soft": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" }
        },
        "wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(3deg)" },
          "75%": { transform: "rotate(-3deg)" }
        },
        
        // Progress and loading animations
        "progress-fill": {
          "0%": { width: "0%" },
          "100%": { width: "100%" }
        },
        "spinner": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        
        // Card reveal animations
        "card-reveal": {
          "0%": {
            opacity: "0",
            transform: "translateY(40px) rotateX(20deg)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0) rotateX(0deg)"
          }
        }
      },
      animation: {
        // Basic animations
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        "float": "float 4s ease-in-out infinite",
        "float-delayed": "float-delayed 5s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "cyber-pulse": "cyber-pulse 3s ease-in-out infinite",
        "circuit": "circuit 8s linear infinite",
        "energy-flow": "energy-flow 2s linear infinite",
        
        // Entrance animations  
        "fade-in": "fade-in 0.6s ease-out",
        "fade-in-up": "fade-in-up 0.8s ease-out",
        "slide-in-right": "slide-in-right 0.5s ease-out",
        "slide-in-left": "slide-in-left 0.5s ease-out",
        "scale-in": "scale-in 0.4s ease-out",
        "zoom-in": "zoom-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "card-reveal": "card-reveal 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        
        // Interactive animations
        "bounce-soft": "bounce-soft 0.6s ease-in-out",
        "wiggle": "wiggle 0.5s ease-in-out",
        
        // Utility animations
        "progress-fill": "progress-fill 2s ease-out",
        "spinner": "spinner 1s linear infinite",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
