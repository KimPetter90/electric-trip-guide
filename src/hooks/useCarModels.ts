import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CarModel {
  id: string;
  brand: string;
  model: string;
  batteryCapacity: number;
  range: number;
  consumption: number;
  image: string;
  variant?: string;
  year?: number;
  maxChargingSpeed?: number;
  acceleration?: number;
  topSpeed?: number;
  seats?: number;
  trunkSpace?: number;
  weight?: number;
  startingPrice?: number;
  dbId?: string;
}

export const useCarModels = () => {
  const [carModels, setCarModels] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadCarModels = async () => {
      try {
        // Først sjekk om bilmodeller finnes i databasen
        const { data: existingCars, error: checkError } = await supabase
          .from('car_models')
          .select('id')
          .limit(1);

        if (checkError) {
          console.error('Error checking car models:', checkError);
        }

        // Hvis ingen biler finnes, populer databasen først
        if (!existingCars || existingCars.length === 0) {
          console.log('🚗 No car models found, populating database...');
          
          const { error: populateError } = await supabase.functions.invoke('populate-car-models');
          
          if (populateError) {
            console.error('Error populating car models:', populateError);
            toast({
              title: "Feil ved initialisering",
              description: "Kunne ikke laste bilmodeller. Prøv å oppdatere siden.",
              variant: "destructive",
            });
            return;
          }
        }

        // Last alle aktive bilmodeller
        const { data, error } = await supabase
          .from('car_models')
          .select('*')
          .eq('is_active', true)
          .eq('available_in_norway', true)
          .order('brand', { ascending: true })
          .order('model', { ascending: true });

        if (error) {
          console.error('Error loading car models:', error);
          toast({
            title: "Feil ved lasting av bilmodeller",
            description: "Kunne ikke laste bilmodeller fra database",
            variant: "destructive",
          });
          return;
        }

        // Transform database format til hook format
        const transformedCars: CarModel[] = (data || []).map(car => ({
          id: car.car_id,
          brand: car.brand,
          model: car.model,
          batteryCapacity: Number(car.battery_capacity_kwh),
          range: car.range_km,
          consumption: Number(car.consumption_kwh_per_100km),
          image: car.image_emoji || '🚗',
          variant: car.variant,
          year: car.year,
          maxChargingSpeed: car.max_charging_speed_kw,
          acceleration: car.acceleration_0_100_kmh ? Number(car.acceleration_0_100_kmh) : undefined,
          topSpeed: car.top_speed_kmh,
          seats: car.seats,
          trunkSpace: car.trunk_space_liters,
          weight: car.weight_kg,
          startingPrice: car.starting_price_nok,
          dbId: car.id
        }));

        setCarModels(transformedCars);
        console.log(`✅ Loaded ${transformedCars.length} car models from database`);

      } catch (err) {
        console.error('Error in loadCarModels:', err);
        toast({
          title: "Feil",
          description: "En uventet feil oppstod ved lasting av bilmodeller",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCarModels();
  }, [toast]);

  return { carModels, loading };
};

export type { CarModel };