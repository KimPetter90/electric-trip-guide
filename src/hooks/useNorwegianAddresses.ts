import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface AddressSuggestion {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenavn: string;
  fylkesnavn: string;
  representasjonspunkt: {
    lat: number;
    lon: number;
  };
  displayText?: string;
  type: 'address';
}

interface PlaceSuggestion {
  stedsnavn: string;
  navnetype: string;
  kommunenavn: string;
  fylkesnavn: string;
  representasjonspunkt: {
    lat: number;
    lon: number;
  };
  displayText?: string;
  type: 'place';
}

type Suggestion = AddressSuggestion | PlaceSuggestion;

interface GeonorgeResponse {
  adresser: Omit<AddressSuggestion, 'type' | 'displayText'>[];
}

interface PlaceResponse {
  navn: Omit<PlaceSuggestion, 'type' | 'displayText'>[];
}

export const useNorwegianAddresses = () => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const searchAddressesAndPlaces = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    
    try {
      // Søk parallelt i både adresser og steder
      const [addressResponse, placeResponse] = await Promise.all([
        // Adresser fra Kartverket
        fetch(`https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(query.trim())}&treffPerSide=5&side=0&asciiKompatibel=true`)
          .catch(() => null),
        // Steder/stedsnavn fra Kartverket
        fetch(`https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodeURIComponent(query.trim())}&treffPerSide=5&side=0&fuzzy=true`)
          .catch(() => null)
      ]);
      
      let allSuggestions: Suggestion[] = [];
      
      // Behandle adresser
      if (addressResponse?.ok) {
        try {
          const addressData: GeonorgeResponse = await addressResponse.json();
          const formattedAddresses: AddressSuggestion[] = addressData.adresser?.map(addr => ({
            ...addr,
            displayText: `${addr.adressetekst}, ${addr.postnummer} ${addr.poststed}${addr.kommunenavn ? `, ${addr.kommunenavn}` : ''}`,
            type: 'address' as const
          })) || [];
          allSuggestions = [...allSuggestions, ...formattedAddresses];
        } catch (e) {
          console.warn('Feil ved parsing av adresser');
        }
      }
      
      // Behandle steder
      if (placeResponse?.ok) {
        try {
          const placeData: PlaceResponse = await placeResponse.json();
          const formattedPlaces: PlaceSuggestion[] = placeData.navn?.map(place => ({
            ...place,
            displayText: `${place.stedsnavn}${place.kommunenavn ? `, ${place.kommunenavn}` : ''}${place.fylkesnavn ? `, ${place.fylkesnavn}` : ''}`,
            type: 'place' as const
          })) || [];
          allSuggestions = [...allSuggestions, ...formattedPlaces];
        } catch (e) {
          console.warn('Feil ved parsing av steder');
        }
      }
      
      // Sorter så steder kommer først, deretter adresser
      allSuggestions.sort((a, b) => {
        if (a.type === 'place' && b.type === 'address') return -1;
        if (a.type === 'address' && b.type === 'place') return 1;
        return 0;
      });
      
      setSuggestions(allSuggestions.slice(0, 10)); // Maks 10 totalt
    } catch (error) {
      console.error('Feil ved søk:', error);
      
      // Fallback til lokal søk hvis API feiler
      const fallbackSuggestions: Suggestion[] = [...norwegianPlaces, ...norwegianCities]
        .filter(place => place.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10)
        .map(place => ({
          stedsnavn: place,
          navnetype: 'sted',
          kommunenavn: '',
          fylkesnavn: '',
          representasjonspunkt: { lat: 0, lon: 0 },
          displayText: place,
          type: 'place' as const
        }));
      
      setSuggestions(fallbackSuggestions);
      
      if (query.length > 2) {
        toast.error('Kunne ikke hente data fra Kartverket. Bruker lokal søk.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search to avoid too many API calls
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      searchAddressesAndPlaces(query);
    }, 300); // Wait 300ms before searching
    
    setSearchTimeout(timeout);
  }, [searchAddressesAndPlaces, searchTimeout]);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return {
    suggestions,
    loading,
    searchAddresses: debouncedSearch,
    clearSuggestions: () => setSuggestions([])
  };
};

// Fallback norske steder og byer for når API ikke er tilgjengelig
const norwegianPlaces = [
  "Oslo Lufthavn Gardermoen", "Bergen Lufthavn Flesland", "Stavanger Lufthavn Sola",
  "Trondheim Lufthavn Værnes", "Tromsø Lufthavn", "Bodø Lufthavn", "Kristiansand Lufthavn",
  "Oslo Sentralstasjon", "Bergen stasjon", "Trondheim Sentralstasjon", "Stavanger stasjon",
  "Drammen stasjon", "Fredrikstad stasjon", "Sarpsborg stasjon", "Moss stasjon",
  "Oslo City", "Bergen Storsenter", "City Syd", "Sandvika Storsenter", "Strømmen Storsenter",
  "Ikea Furuset", "Ikea Åsane", "Ikea Slependen", "Ikea Leangen", "Ikea Forus",
  "Rikshospitalet", "Haukeland sykehus", "St. Olavs hospital", "Stavanger universitetssjukehus",
  "Universitetet i Oslo", "Universitetet i Bergen", "NTNU Trondheim", "Universitetet i Stavanger",
  "Holmenkollen", "Frognerparken", "Vigelandsparken", "Akershus festning", "Preikestolen",
  "Geirangerfjorden", "Lofoten", "Nordkapp", "Flåm"
];

const norwegianCities = [
  "Oslo", "Bergen", "Trondheim", "Stavanger", "Bærum", "Kristiansand", "Fredrikstad",
  "Sandnes", "Tromsø", "Drammen", "Asker", "Lillestrøm", "Halden", "Moss", "Bodø",
  "Molde", "Ålesund", "Tønsberg", "Haugesund", "Sandefjord", "Arendal", "Hamar",
  "Larvik", "Askøy", "Gjøvik", "Mo i Rana", "Harstad", "Horten",
  "Lillehammer", "Grimstad", "Kongsberg", "Hammerfest", "Florø", "Narvik",
  "Elverum", "Lyngdal", "Alta", "Raufoss", "Bryne", "Mandal",
  "Jessheim", "Vennesla", "Ås", "Verdal", "Knarvik", "Notodden", "Tvedestrand"
];