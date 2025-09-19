import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.elroute',
  appName: 'elroute',
  webDir: 'dist',
  server: {
    url: 'https://9a7124bc-51c6-4220-9c3e-a9b0a99b385b.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;