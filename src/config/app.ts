export const APP_CONFIG = {
  name: "ElRoute",
  tagline: "Smart elbilruting for Norge",
  version: "1.0.0",
  environment: process.env.NODE_ENV || "development"
} as const;

export const ROUTE_CONFIG = {
  FREE_TIER_MONTHLY_LIMIT: 25,
  DEFAULT_BATTERY_PERCENTAGE: 80,
  CACHE_DURATION_MS: 300000, // 5 minutes
  ROUTE_CALCULATION: {
    MIN_SEARCH_LENGTH: 3,
    SAFETY_MARGIN: 0.15, // 15% battery buffer
    SPEED_ASSUMPTIONS: {
      FASTEST: 90, // km/h average
      SHORTEST: 75, // km/h average  
      ECO: 80 // km/h average
    },
    COST_PER_KM: {
      FASTEST: 0.6,
      SHORTEST: 0.55,
      ECO: 0.5
    },
    RANGE_MULTIPLIERS: {
      FASTEST: 0.85, // Higher speed = more consumption
      SHORTEST: 0.9,
      ECO: 1.05 // Optimized driving
    }
  }
} as const;

export const MAP_CONFIG = {
  DEFAULT_CENTER: { lat: 60.472, lng: 8.4689 }, // Norway center
  DEFAULT_ZOOM: 6,
  NAVIGATION_ZOOM: 17,
  MAX_NAVIGATION_ZOOM: 25,
  UPDATE_INTERVALS: {
    GPS_TRACKING: 5000, // 5 seconds
    ROUTE_REFRESH: 30000 // 30 seconds
  }
} as const;

export const CHARGING_CONFIG = {
  DEFAULT_CHARGE_LEVEL: 80, // Target charge percentage
  RAPID_CHARGING_THRESHOLD: 50, // kW threshold for "rapid" charging
  CHARGING_SPEEDS: {
    SLOW: { min: 3, max: 7 }, // kW
    FAST: { min: 22, max: 43 }, // kW
    RAPID: { min: 50, max: 150 } // kW
  }
} as const;

export const PRODUCTION_DOMAINS = [
  'elroute.no',
  'www.elroute.no', 
  'elroute.com',
  'www.elroute.com',
  'elroute.npo',
  'www.elroute.npo'
] as const;

export const DEVELOPMENT_CONFIG = {
  ALLOW_LOVABLE_DOMAINS: true,
  ENABLE_DEBUG_LOGGING: true,
  SKIP_PRODUCTION_CHECKS: false
} as const;