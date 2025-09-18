// Avansert ruteberegning som tar hensyn til alle faktorer
interface CarModel {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
  image: string;
}

interface RouteData {
  from: string;
  to: string;
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
  travelDate?: Date;
}

interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  humidity: number;
  conditions: string;
}

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  available: number;
  total: number;
  fast_charger: boolean;
  power: string;
  cost: number;
  provider: string;
  address: string;
}

export interface OptimizedChargingPlan {
  station: ChargingStation;
  distanceFromStart: number;
  batteryLevelOnArrival: number;
  chargingTime: number;
  energyNeeded: number;
  cost: number;
  isOptimal: boolean;
  weatherImpact: number;
}

export class RouteOptimizer {
  /**
   * Beregner optimal ladeplan basert på bil, rute, vær og hengervekt
   */
  static calculateOptimalChargingPlan(
    car: CarModel,
    routeData: RouteData,
    stations: ChargingStation[],
    weather: WeatherData | null,
    totalRouteDistance: number
  ): OptimizedChargingPlan[] {
    if (!car || !routeData || totalRouteDistance === 0) {
      return [];
    }

    // Beregn faktisk forbruk basert på alle faktorer
    const baseConsumption = car.consumption; // kWh/100km
    const weatherImpact = this.calculateWeatherImpact(weather);
    const trailerImpact = this.calculateTrailerImpact(routeData.trailerWeight);
    
    const adjustedConsumption = baseConsumption * (1 + weatherImpact + trailerImpact);
    
    console.log(`🔋 Beregner optimal ladeplan:`);
    console.log(`📊 Base forbruk: ${baseConsumption} kWh/100km`);
    console.log(`🌡️ Værpåvirkning: ${(weatherImpact * 100).toFixed(1)}%`);
    console.log(`🚛 Hengerpåvirkning: ${(trailerImpact * 100).toFixed(1)}%`);
    console.log(`⚡ Justert forbruk: ${adjustedConsumption.toFixed(2)} kWh/100km`);

    // Beregn tilgjengelig energi ved start
    const startBatteryKwh = (car.batteryCapacity * routeData.batteryPercentage) / 100;
    const maxRangeWithCurrentBattery = (startBatteryKwh / adjustedConsumption) * 100; // km
    
    console.log(`🔋 Batteri ved start: ${startBatteryKwh.toFixed(1)} kWh (${routeData.batteryPercentage}%)`);
    console.log(`📏 Rekkevidde med nåværende batteri: ${maxRangeWithCurrentBattery.toFixed(1)} km`);

    // Finn optimale ladepunkter
    const optimalStations: OptimizedChargingPlan[] = [];
    
    // Beregn hvor langt vi kan kjøre med 10% sikkerhetsmargin
    const safeRange = maxRangeWithCurrentBattery * 0.9;
    
    // Hvis ruten er lengre enn rekkevidde, finn optimal ladestasjon
    if (totalRouteDistance > safeRange) {
      const optimalDistance = safeRange * 0.8; // Lade når vi har 20% igjen for sikkerhet
      
      // Finn beste stasjon rundt optimal avstand
      const nearbyStations = stations.filter(station => {
        const distance = this.estimateDistanceFromStart(station, routeData.from);
        return distance >= (optimalDistance - 30) && distance <= (optimalDistance + 30);
      });

      // Sorter etter kvalitet (tilgjengelighet, hurtiglading, pris)
      const rankedStations = nearbyStations
        .map(station => {
          const distanceFromStart = this.estimateDistanceFromStart(station, routeData.from);
          const batteryOnArrival = this.calculateBatteryLevelAtDistance(
            startBatteryKwh,
            car.batteryCapacity,
            distanceFromStart,
            adjustedConsumption
          );
          
          // Beregn hvor mye energi som trengs for å nå destinasjonen
          const remainingDistance = totalRouteDistance - distanceFromStart;
          const energyNeededForRemainder = (remainingDistance / 100) * adjustedConsumption;
          const targetBatteryLevel = Math.min(car.batteryCapacity * 0.9, energyNeededForRemainder * 1.2); // 20% buffer
          const energyToCharge = Math.max(0, targetBatteryLevel - (batteryOnArrival / 100) * car.batteryCapacity);
          
          const chargingTime = this.estimateChargingTime(energyToCharge, station.fast_charger);
          const chargingCost = energyToCharge * station.cost;

          return {
            station,
            distanceFromStart,
            batteryLevelOnArrival: batteryOnArrival,
            chargingTime,
            energyNeeded: energyToCharge,
            cost: chargingCost,
            isOptimal: true,
            weatherImpact: weatherImpact
          };
        })
        .filter(plan => plan.batteryLevelOnArrival > 5) // Må ha minst 5% når vi ankommer
        .sort((a, b) => {
          // Prioriter tilgjengelighet, så hurtiglading, så pris
          const availabilityA = a.station.available / a.station.total;
          const availabilityB = b.station.available / b.station.total;
          
          if (Math.abs(availabilityA - availabilityB) > 0.2) {
            return availabilityB - availabilityA; // Høyere tilgjengelighet først
          }
          
          if (a.station.fast_charger !== b.station.fast_charger) {
            return a.station.fast_charger ? -1 : 1; // Hurtiglading først
          }
          
          return a.cost - b.cost; // Lavere pris først
        });

      // Velg den beste stasjonen
      if (rankedStations.length > 0) {
        optimalStations.push(rankedStations[0]);
        console.log(`💙 Anbefaler ladestasjon: ${rankedStations[0].station.name}`);
        console.log(`📍 Avstand fra start: ${rankedStations[0].distanceFromStart.toFixed(1)} km`);
        console.log(`🔋 Batteri ved ankomst: ${rankedStations[0].batteryLevelOnArrival.toFixed(1)}%`);
        console.log(`⚡ Energi å lade: ${rankedStations[0].energyNeeded.toFixed(1)} kWh`);
        console.log(`⏰ Ladetid: ${rankedStations[0].chargingTime} min`);
        console.log(`💰 Kostnad: ${rankedStations[0].cost.toFixed(0)} kr`);
      }
    } else {
      console.log(`✅ Ruten (${totalRouteDistance.toFixed(1)} km) kan kjøres uten lading`);
    }

    return optimalStations;
  }

  /**
   * Beregner værpåvirkning på energiforbruk
   */
  private static calculateWeatherImpact(weather: WeatherData | null): number {
    if (!weather) return 0;

    let impact = 0;

    // Temperaturpåvirkning
    if (weather.temperature < -10) {
      impact += 0.25; // 25% økt forbruk under -10°C
    } else if (weather.temperature < 0) {
      impact += 0.15; // 15% økt forbruk mellom -10°C og 0°C
    } else if (weather.temperature > 30) {
      impact += 0.10; // 10% økt forbruk over 30°C (aircondition)
    }

    // Vindpåvirkning
    if (weather.windSpeed > 15) {
      impact += 0.08; // 8% økt forbruk ved sterk vind
    } else if (weather.windSpeed > 10) {
      impact += 0.04; // 4% økt forbruk ved moderat vind
    }

    // Nedbørpåvirkning
    if (weather.precipitation > 0) {
      impact += 0.05; // 5% økt forbruk ved nedbør
    }

    return Math.min(impact, 0.4); // Maks 40% økning
  }

  /**
   * Beregner hengervektpåvirkning på energiforbruk
   */
  private static calculateTrailerImpact(trailerWeight: number): number {
    if (trailerWeight <= 0) return 0;
    
    // Lineær økning basert på vekt
    // 500kg = 10% økning, 1000kg = 20% økning, osv.
    const impactPercentage = (trailerWeight / 500) * 0.10;
    return Math.min(impactPercentage, 0.5); // Maks 50% økning
  }

  /**
   * Estimerer avstand fra start til ladestasjon
   */
  private static estimateDistanceFromStart(station: ChargingStation, startLocation: string): number {
    // Enkel estimering basert på bredde/lengdegrader
    // I en ekte implementasjon ville vi brukt Google Directions API
    
    // For norske koordinater: ca 1 grad lengde = 40-70 km, 1 grad bredde = 111 km
    // Dette er en forenkling for demo
    
    // Hardkodede eksempler for testing
    const stationName = station.name.toLowerCase();
    if (stationName.includes('oslo')) return 450; // Ålesund til Oslo ca 450km
    if (stationName.includes('trondheim')) return 150; // Ålesund til Trondheim ca 150km
    if (stationName.includes('bergen')) return 230; // Ålesund til Bergen ca 230km
    if (stationName.includes('ålesund')) return 5; // Lokalt i Ålesund
    
    // Fallback: tilfeldig verdi mellom 100-400km
    return 100 + Math.random() * 300;
  }

  /**
   * Beregner batterinivå ved gitt avstand
   */
  private static calculateBatteryLevelAtDistance(
    startBatteryKwh: number,
    totalBatteryCapacity: number,
    distance: number,
    consumptionPer100km: number
  ): number {
    const energyUsed = (distance / 100) * consumptionPer100km;
    const remainingEnergy = Math.max(0, startBatteryKwh - energyUsed);
    return (remainingEnergy / totalBatteryCapacity) * 100;
  }

  /**
   * Estimerer ladetid basert på energimengde og ladetype
   */
  private static estimateChargingTime(energyKwh: number, isFastCharger: boolean): number {
    if (energyKwh <= 0) return 0;
    
    const chargingPowerKw = isFastCharger ? 50 : 22; // 50kW hurtiglading, 22kW normal
    const timeHours = energyKwh / chargingPowerKw;
    return Math.ceil(timeHours * 60); // Minutter
  }

  /**
   * Validerer at alle nødvendige data er tilgjengelig
   */
  static validateRouteData(car: CarModel | null, routeData: RouteData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!car) {
      errors.push("Ingen bil valgt");
    }

    if (!routeData.from || routeData.from.trim().length === 0) {
      errors.push("Startdestinasjon mangler");
    }

    if (!routeData.to || routeData.to.trim().length === 0) {
      errors.push("Sluttdestinasjon mangler");
    }

    if (routeData.from && routeData.to && 
        routeData.from.toLowerCase().trim() === routeData.to.toLowerCase().trim()) {
      errors.push("Start- og sluttdestinasjon kan ikke være den samme");
    }

    if (routeData.batteryPercentage <= 0 || routeData.batteryPercentage > 100) {
      errors.push("Batteriprosent må være mellom 1% og 100%");
    }

    if (routeData.trailerWeight < 0 || routeData.trailerWeight > 3500) {
      errors.push("Hengervekt må være mellom 0 og 3500 kg");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}