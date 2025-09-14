import { Preferences } from '@capacitor/preferences';
import { CarModel } from '@/components/CarSelector';

export interface SavedRoute {
  id: string;
  name: string;
  from: string;
  to: string;
  car: CarModel;
  batteryPercentage: number;
  trailerWeight: number;
  createdAt: string;
}

export interface AppSettings {
  favoriteLocation: string;
  defaultBatteryPercentage: number;
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark' | 'auto';
}

class OfflineStorage {
  private static instance: OfflineStorage;
  
  public static getInstance(): OfflineStorage {
    if (!OfflineStorage.instance) {
      OfflineStorage.instance = new OfflineStorage();
    }
    return OfflineStorage.instance;
  }

  // Saved Routes
  async getSavedRoutes(): Promise<SavedRoute[]> {
    try {
      const { value } = await Preferences.get({ key: 'saved_routes' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting saved routes:', error);
      return [];
    }
  }

  async saveRoute(route: Omit<SavedRoute, 'id' | 'createdAt'>): Promise<void> {
    try {
      const routes = await this.getSavedRoutes();
      const newRoute: SavedRoute = {
        ...route,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      routes.push(newRoute);
      await Preferences.set({
        key: 'saved_routes',
        value: JSON.stringify(routes)
      });
    } catch (error) {
      console.error('Error saving route:', error);
    }
  }

  async deleteRoute(routeId: string): Promise<void> {
    try {
      const routes = await this.getSavedRoutes();
      const filteredRoutes = routes.filter(route => route.id !== routeId);
      await Preferences.set({
        key: 'saved_routes',
        value: JSON.stringify(filteredRoutes)
      });
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  }

  // Favorite Cars
  async getFavoriteCars(): Promise<CarModel[]> {
    try {
      const { value } = await Preferences.get({ key: 'favorite_cars' });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting favorite cars:', error);
      return [];
    }
  }

  async addFavoriteCar(car: CarModel): Promise<void> {
    try {
      const favorites = await this.getFavoriteCars();
      if (!favorites.find(fav => fav.id === car.id)) {
        favorites.push(car);
        await Preferences.set({
          key: 'favorite_cars',
          value: JSON.stringify(favorites)
        });
      }
    } catch (error) {
      console.error('Error adding favorite car:', error);
    }
  }

  async removeFavoriteCar(carId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteCars();
      const filteredFavorites = favorites.filter(car => car.id !== carId);
      await Preferences.set({
        key: 'favorite_cars',
        value: JSON.stringify(filteredFavorites)
      });
    } catch (error) {
      console.error('Error removing favorite car:', error);
    }
  }

  // App Settings
  async getSettings(): Promise<AppSettings> {
    try {
      const { value } = await Preferences.get({ key: 'app_settings' });
      const defaultSettings: AppSettings = {
        favoriteLocation: '',
        defaultBatteryPercentage: 80,
        units: 'metric',
        theme: 'auto'
      };
      return value ? { ...defaultSettings, ...JSON.parse(value) } : defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        favoriteLocation: '',
        defaultBatteryPercentage: 80,
        units: 'metric',
        theme: 'auto'
      };
    }
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      await Preferences.set({
        key: 'app_settings',
        value: JSON.stringify(newSettings)
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }

  // Usage Statistics (for offline analytics)
  async logUsage(action: string, data?: any): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'usage_stats' });
      const stats = value ? JSON.parse(value) : [];
      stats.push({
        action,
        data,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 1000 entries to prevent storage bloat
      if (stats.length > 1000) {
        stats.splice(0, stats.length - 1000);
      }
      
      await Preferences.set({
        key: 'usage_stats',
        value: JSON.stringify(stats)
      });
    } catch (error) {
      console.error('Error logging usage:', error);
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await Preferences.clear();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export const offlineStorage = OfflineStorage.getInstance();
