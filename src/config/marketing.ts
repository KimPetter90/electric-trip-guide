export const CONVERSION_CONFIG = {
  EXIT_INTENT: {
    discount: {
      percentage: 70,
      originalPrice: 199,
      discountedPrice: 59,
      timeLimit: 600, // 10 minutes in seconds
      currency: "NOK"
    },
    triggers: {
      mouseLeaveBoundary: 0, // pixels from top
      showDelaySeconds: 0,
      cooldownHours: 24
    },
    messages: {
      title: "VENT! Ikke gå ennå! 🚨",
      subtitle: "Eksklusiv rabatt bare for deg:",
      urgencyText: "RABATT - KUN I",
      ctaText: "HENT RABATTEN NÅ!",
      guarantees: [
        "30 dager gratis prøveperiode",
        "Avbryt når som helst", 
        "Sikkert betalingssystem"
      ]
    }
  },
  REVENUE_BOOSTER: {
    discount: {
      percentage: 85,
      originalPrice: 199,
      discountedPrice: 29,
      yearlyRawSavings: 2040,
      currency: "NOK"
    },
    triggers: {
      showAfterSeconds: 30,
      updateIntervalSeconds: 10,
      urgencyMinutes: 15
    },
    scarcity: {
      spotsLeft: 7,
      recentSignupsBase: 23,
      todayRevenueBase: 4780
    },
    messages: {
      title: "🔥 SISTE SJANSE - MEGA RABATT! 🔥",
      urgencyText: "RABATT - BARE I 15 MINUTTER!",
      ctaText: "HENT MEGA-RABATTEN NÅ!",
      scarcityText: "Kun 7 plasser igjen til denne prisen!"
    }
  },
  CONVERSION_BOOSTER: {
    timers: {
      specialOfferDuration: 86400, // 24 hours in seconds
      updateInterval: 1000 // 1 second
    },
    socialProof: {
      baseUserCount: 127,
      incrementProbability: 0.1, // 10% chance every update
      maxDailyIncrements: 50
    },
    trustIndicators: [
      { icon: "TrendingUp", text: "98% fornøyde kunder", color: "green" },
      { icon: "Zap", text: "Kun 3 dager igjen", color: "yellow" },
      { icon: "Clock", text: "Rask aktivering", color: "blue" }
    ]
  }
} as const;

export const URGENCY_MESSAGES = {
  LIMITED_TIME: "TIDSBEGRENSET TILBUD UTLØPER OM:",
  TODAY_SIGNUPS: "nye kunder i dag",
  TODAY_REVENUE: "omsetning i dag",
  SPOTS_REMAINING: "plasser igjen",
  GUARANTEE_CANCELLATION: "Avbryt når som helst",
  GUARANTEE_MONEY_BACK: "30 dager pengene tilbake",
  GUARANTEE_FAST_ACTIVATION: "Rask aktivering"
} as const;

export const ANALYTICS_SIMULATION = {
  USER_GROWTH: {
    baseCount: 127,
    dailyGrowthMin: 15,
    dailyGrowthMax: 45,
    incrementInterval: 10000 // 10 seconds
  },
  REVENUE_SIMULATION: {
    baseRevenue: 4780,
    dailyRevenueMin: 500,
    dailyRevenueMax: 8000,
    incrementMin: 99,
    incrementMax: 298
  }
} as const;