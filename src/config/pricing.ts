export const STRIPE_PRICE_IDS = {
  PREMIUM: "price_1S9U5rDgjF2NREPhuG6Kvd1Q",
  PRO: "price_1S9U6RDgjF2NREPhxe8pPOqz",
  PREMIUM_YEARLY: "price_1S9U6eDgjF2NREPhAgggcpu0",
  PREMIUM_STUDENT: "price_1S9U6yDgjF2NREPhZchK8E4m",
  PRO_YEARLY: "price_1S9U6oDgjF2NREPhkyi7IeoS"
} as const;

export const PRICING_CONFIG = {
  PLANS: {
    FREE: {
      name: "Gratis versjon",
      price: 0,
      monthlyRouteLimit: 25,
      features: [
        "25 ruter/måned",
        "Grunnleggende kart", 
        "Ladestasjoner",
        "Community support"
      ]
    },
    PREMIUM: {
      id: "premium",
      name: "ElRoute Premium",
      price: 99,
      originalPrice: 199,
      priceId: STRIPE_PRICE_IDS.PREMIUM,
      description: "💥 SPESIALTILBUD - 50% rabatt! Perfekt for private brukere",
      monthlyRouteLimit: 100,
      features: [
        "100 ruter per måned",
        "Værintegrasjon",
        "Ruteoptimalisering", 
        "Ladestasjonsinfo",
        "Ferjeinfo med sanntidsdata",
        "Mobil-app",
        "E-post support"
      ],
      popular: true
    },
    PRO: {
      id: "pro", 
      name: "ElRoute Pro",
      price: 199,
      originalPrice: 399,
      priceId: STRIPE_PRICE_IDS.PRO,
      description: "🚀 KRAFTIG REDUSERT! For power-brukere og bedrifter",
      monthlyRouteLimit: -1, // Unlimited
      features: [
        "Ubegrensede ruter",
        "Avansert værintegrasjon", 
        "AI-ruteoptimalisering",
        "Prioritert support (24/7)",
        "API-tilgang",
        "Ferjeintegrasjon med sanntid",
        "Eksport til GPX/KML",
        "Business analytics",
        "Rapporter og analytics",
        "Dedikert kontoansvarlig"
      ],
      popular: false
    }
  },
  CURRENCY: "NOK",
  BILLING_INTERVAL: "mnd"
} as const;

export const TRIAL_CONFIG = {
  DURATION_DAYS: 30,
  FREE_TIER_ROUTE_LIMIT: 25
} as const;

export const DISCOUNT_CONFIG = {
  SPECIAL_OFFER: {
    percentage: 50,
    validUntil: new Date('2024-12-31'),
    code: "LAUNCH50"
  },
  STUDENT_DISCOUNT: {
    percentage: 25,
    priceId: STRIPE_PRICE_IDS.PREMIUM_STUDENT
  },
  YEARLY_DISCOUNT: {
    percentage: 15,
    premiumPriceId: STRIPE_PRICE_IDS.PREMIUM_YEARLY,
    proPriceId: STRIPE_PRICE_IDS.PRO_YEARLY
  }
} as const;