// Input validation utilities

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateNorwegianCity = (city: string): boolean => {
  if (!city || city.trim().length < 2) return false;
  
  // Tillatte karakterer for norske stedsnavn
  const norwegianCityRegex = /^[a-zA-ZæøåÆØÅ\s\-\.]+$/;
  return norwegianCityRegex.test(city.trim());
};

export const validateBatteryPercentage = (percentage: number): boolean => {
  return percentage >= 0 && percentage <= 100;
};

export const validateTrailerWeight = (weight: number): boolean => {
  return weight >= 0 && weight <= 3500; // Max 3.5 tonn
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 100); // Limit length
};

export const validateRouteData = (routeData: {
  from: string;
  to: string;
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
}) => {
  const errors: string[] = [];

  if (!routeData.from || !validateNorwegianCity(routeData.from)) {
    errors.push('Ugyldig startdestinasjon');
  }

  if (!routeData.to || !validateNorwegianCity(routeData.to)) {
    errors.push('Ugyldig sluttdestinasjon');
  }

  if (routeData.from && routeData.to && 
      routeData.from.toLowerCase().trim() === routeData.to.toLowerCase().trim()) {
    errors.push('Start- og sluttdestinasjon kan ikke være den samme');
  }

  if (routeData.via && !validateNorwegianCity(routeData.via)) {
    errors.push('Ugyldig mellomdestinasjon');
  }

  if (!validateBatteryPercentage(routeData.batteryPercentage)) {
    errors.push('Batteriprosent må være mellom 0 og 100');
  }

  if (!validateTrailerWeight(routeData.trailerWeight)) {
    errors.push('Hengervekt må være mellom 0 og 3500 kg');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCarData = (car: {
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
}) => {
  const errors: string[] = [];

  if (!car.brand || car.brand.trim().length < 2) {
    errors.push('Ugyldig bilmerke');
  }

  if (!car.model || car.model.trim().length < 1) {
    errors.push('Ugyldig bilmodell');
  }

  if (!car.batteryCapacity || car.batteryCapacity < 10 || car.batteryCapacity > 200) {
    errors.push('Batterikapasitet må være mellom 10 og 200 kWh');
  }

  if (!car.range || car.range < 50 || car.range > 1000) {
    errors.push('Rekkevidde må være mellom 50 og 1000 km');
  }

  if (!car.consumption || car.consumption < 10 || car.consumption > 50) {
    errors.push('Forbruk må være mellom 10 og 50 kWh/100km');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting for API calls
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export const isRateLimited = (key: string, maxRequests = 10, windowMs = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now - record.lastReset > windowMs) {
    rateLimitMap.set(key, { count: 1, lastReset: now });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
};

// Sanitize file uploads
export const validateFileUpload = (file: File) => {
  const errors: string[] = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (file.size > maxSize) {
    errors.push('Filen er for stor (maks 5MB)');
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push('Ugyldig filtype. Kun JPEG, PNG og WebP er tillatt');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};