import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Palette, 
  Globe, 
  Battery, 
  MapPin,
  Trash2,
  RefreshCw
} from "lucide-react";
import { offlineStorage, AppSettings } from "@/utils/offlineStorage";
import { useToast } from "@/hooks/use-toast";
import { useDeviceInfo } from "@/hooks/useNativeCapabilities";

export default function OfflineSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    favoriteLocation: '',
    defaultBatteryPercentage: 80,
    units: 'metric',
    theme: 'auto'
  });
  const { toast } = useToast();
  const deviceInfo = useDeviceInfo();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const currentSettings = await offlineStorage.getSettings();
    setSettings(currentSettings);
  };

  const updateSetting = async (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await offlineStorage.updateSettings({ [key]: value });
    await offlineStorage.logUsage('update_setting', { key, value });
    
    toast({
      title: "Innstilling oppdatert",
      description: "Endringen er lagret offline"
    });
  };

  const clearAllData = async () => {
    if (confirm('Er du sikker på at du vil slette alle lagrede data? Dette kan ikke angres.')) {
      await offlineStorage.clearAllData();
      await loadSettings(); // Reload default settings
      
      toast({
        title: "Alle data slettet",
        description: "Appen er tilbakestilt til standardinnstillinger",
        variant: "destructive"
      });
    }
  };

  const resetToDefaults = async () => {
    const defaultSettings: AppSettings = {
      favoriteLocation: '',
      defaultBatteryPercentage: 80,
      units: 'metric',
      theme: 'auto'
    };
    
    setSettings(defaultSettings);
    await offlineStorage.updateSettings(defaultSettings);
    
    toast({
      title: "Tilbakestilt til standard",
      description: "Alle innstillinger er tilbakestilt"
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          App Innstillinger
        </h2>

        {/* Theme Settings */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Utseende
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'dark', 'auto'] as const).map((theme) => (
                <Button
                  key={theme}
                  onClick={() => updateSetting('theme', theme)}
                  variant={settings.theme === theme ? "default" : "outline"}
                  size="sm"
                >
                  {theme === 'light' ? 'Lys' : theme === 'dark' ? 'Mørk' : 'Auto'}
                </Button>
              ))}
            </div>
          </div>

          {/* Units */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Enheter
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(['metric', 'imperial'] as const).map((unit) => (
                <Button
                  key={unit}
                  onClick={() => updateSetting('units', unit)}
                  variant={settings.units === unit ? "default" : "outline"}
                  size="sm"
                >
                  {unit === 'metric' ? 'Metrisk (km)' : 'Imperial (miles)'}
                </Button>
              ))}
            </div>
          </div>

          {/* Default Battery Percentage */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Battery className="h-4 w-4" />
              Standard batteriprosent
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {[50, 60, 70, 80, 90].map((percentage) => (
                <Button
                  key={percentage}
                  onClick={() => updateSetting('defaultBatteryPercentage', percentage)}
                  variant={settings.defaultBatteryPercentage === percentage ? "default" : "outline"}
                  size="sm"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
          </div>

          {/* Favorite Location */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Hjemmelokasjon
            </h3>
            <input
              type="text"
              placeholder="F.eks. Oslo, Norge"
              value={settings.favoriteLocation}
              onChange={(e) => updateSetting('favoriteLocation', e.target.value)}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-md focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </Card>

      {/* Device Info */}
      {deviceInfo && (
        <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
          <h3 className="font-semibold mb-3">Enhetsinformasjon</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plattform:</span>
              <Badge variant="outline">{deviceInfo.platform}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Operativsystem:</span>
              <span>{deviceInfo.operatingSystem} {deviceInfo.osVersion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modell:</span>
              <span>{deviceInfo.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">App versjon:</span>
              <Badge variant="secondary">1.0.0</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Data Management */}
      <Card className="p-6 bg-card/80 backdrop-blur-sm border-border">
        <h3 className="font-semibold mb-3">Databehandling</h3>
        <div className="space-y-3">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tilbakestill innstillinger
          </Button>
          
          <Button
            onClick={clearAllData}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Slett alle data
          </Button>
          
          <p className="text-xs text-muted-foreground text-center">
            Alle data lagres lokalt på enheten. Ingen data sendes til eksterne servere.
          </p>
        </div>
      </Card>
    </div>
  );
}