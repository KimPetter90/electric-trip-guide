import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9a7124bc51c642209c3ea9b0a99b385b',
  appName: 'electric-trip-guide',
  webDir: 'dist',
  // For development: use server config below
  // For production: comment out server config
  server: {
    url: 'https://9a7124bc-51c6-4220-9c3e-a9b0a99b385b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f0f23',
      showSpinner: false
    }
  }
};

export default config;