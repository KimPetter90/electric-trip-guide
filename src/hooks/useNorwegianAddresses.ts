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
}

interface GeonorgeResponse {
  adresser: AddressSuggestion[];
}

export const useNorwegianAddresses = () => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const searchAddresses = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    
    try {
      // Bruk Kartverkets adresse-API (Geonorge)
      const response = await fetch(
        `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(query.trim())}&treffPerSide=10&side=0&asciiKompatibel=true`
      );
      
      if (!response.ok) {
        throw new Error(`API feil: ${response.status}`);
      }
      
      const data: GeonorgeResponse = await response.json();
      
      // Filter og format resultatene
      const formatted = data.adresser?.map(addr => ({
        ...addr,
        displayText: `${addr.adressetekst}, ${addr.postnummer} ${addr.poststed}${addr.kommunenavn ? `, ${addr.kommunenavn}` : ''}`
      })) || [];
      
      setSuggestions(formatted);
    } catch (error) {
      console.error('Feil ved adressesøk:', error);
      
      // Fallback til lokal søk hvis API feiler
      const fallbackSuggestions = norwegianCities
        .filter(city => city.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10)
        .map(city => ({
          adressetekst: city,
          postnummer: '',
          poststed: '',
          kommunenavn: '',
          fylkesnavn: '',
          representasjonspunkt: { lat: 0, lon: 0 },
          displayText: city
        }));
      
      setSuggestions(fallbackSuggestions);
      
      if (query.length > 2) {
        toast.error('Kunne ikke hente adresser fra Kartverket. Bruker lokal søk.');
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
      searchAddresses(query);
    }, 300); // Wait 300ms before searching
    
    setSearchTimeout(timeout);
  }, [searchAddresses, searchTimeout]);

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

// Fallback norske steder for når API ikke er tilgjengelig
const norwegianCities = [
  "Oslo", "Bergen", "Trondheim", "Stavanger", "Bærum", "Kristiansand", "Fredrikstad",
  "Sandnes", "Tromsø", "Drammen", "Asker", "Lillestrøm", "Halden", "Moss", "Bodø",
  "Molde", "Ålesund", "Tønsberg", "Haugesund", "Sandefjord", "Arendal", "Hamar",
  "Larvik", "Halden", "Askøy", "Gjøvik", "Mo i Rana", "Harstad", "Horten",
  "Lillehammer", "Grimstad", "Kongsberg", "Hammerfest", "Florø", "Narvik",
  "Elverum", "Lyngdal", "Alta", "Moss", "Raufoss", "Bryne", "Mandal",
  "Jessheim", "Vennesla", "Ås", "Verdal", "Knarvik", "Notodden", "Tvedestrand"
];