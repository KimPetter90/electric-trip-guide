// ELROUTE LANSERING - KOMPLETT FUNKSJON-SJEKKLISTE
// 🚀 Pre-launch Function Testing Checklist

export const LAUNCH_CHECKLIST = {
  // 1. KRITISKE FUNKSJONER (MÅ FUNGERE 100%)
  critical: {
    authentication: {
      login: "❓ Test innlogging med email/passord",
      register: "❓ Test registrering av ny bruker", 
      logout: "❓ Test utlogging og session cleanup",
      sessionPersistence: "❓ Test at bruker forblir innlogget ved refresh"
    },
    
    carSelector: {
      loadCars: "✅ 106 bilmodeller lastes korrekt",
      selectCar: "✅ Bilvalg fungerer",
      changeCar: "✅ 'Bytt bil' knapp fungerer",
      favoriteCar: "❓ Test favorittbil lagring og auto-selection"
    },
    
    payments: {
      subscriptionCheck: "⚠️ check-subscription har timestamp-feil (fikset nå)",
      checkout: "❓ Test Stripe checkout flow", 
      newPrices: "✅ Optimaliserte priser implementert",
      trialActivation: "❓ Test 30-dagers gratis trial",
      customerPortal: "❓ Test subscription management"
    },
    
    routing: {
      googleMaps: "❓ Test Google Maps integration",
      routeCalculation: "❓ Test ruteberegning med ladestasjoner",
      weatherImpact: "❓ Test værpåvirkning på reichweite", 
      chargingStations: "❓ Test ladestasjon-database (burde ha data)"
    }
  },

  // 2. VIKTIGE FUNKSJONER (BØR FUNGERE)
  important: {
    database: {
      carModelsTable: "✅ 106 modeller i databasen",
      chargingStationsTable: "❓ Sjekk antall ladestasjoner",
      userSettings: "❓ Test brukerinnstillinger",
      routeLimits: "❓ Test rute-begrensninger (25 gratis, unlimited pro)"
    },
    
    userExperience: {
      responsiveDesign: "❓ Test på mobil og desktop",
      loadingStates: "❓ Test loading-indikatorer",
      errorHandling: "❓ Test feilhåndtering",
      navigation: "❓ Test navigasjon mellom sider"
    },
    
    admin: {
      adminAccess: "✅ Admin-rolle fungerer for deg", 
      userManagement: "❓ Test admin-funksjoner",
      analytics: "❓ Test analytics dashboard"
    }
  },

  // 3. NICE-TO-HAVE (Kan fikses etter lansering)
  optional: {
    performance: {
      pageLoadSpeed: "❓ Test sidehastighet",
      imageOptimization: "❓ Test bildeoptimalisering", 
      caching: "❓ Test browser caching"
    },
    
    seo: {
      metaTags: "❓ Sjekk meta tags for SEO",
      sitemap: "❓ Generer sitemap",
      robotsTxt: "✅ robots.txt eksisterer"
    }
  }
};

// LANSERINGSSTRATEGI
export const LAUNCH_STRATEGY = {
  phase1: "Fix alle KRITISKE funksjoner",
  phase2: "Test VIKTIGE funksjoner", 
  phase3: "Publiser med eget domene",
  phase4: "Start markedsføring"
};

// PRIORITERTE TESTER FOR DEG Å GJØRE NÅ:
export const IMMEDIATE_TESTS = [
  "1. Test innlogging/registrering flow",
  "2. Test en komplett rute fra A til B", 
  "3. Test Stripe checkout med test-kort",
  "4. Test på mobil (responsive design)",
  "5. Test ladestasjoner vises på kart"
];

console.log("🚀 ELROUTE LAUNCH CHECKLIST LOADED");
console.log("Next steps:", IMMEDIATE_TESTS);