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
      // Søk parallelt i både adresser og steder med flere strategier
      const [addressResponse, placeResponse, alternativeResponse] = await Promise.all([
        // Adresser fra Kartverket
        fetch(`https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(query.trim())}&treffPerSide=8&side=0&asciiKompatibel=true`)
          .catch(() => null),
        // Steder/stedsnavn fra Kartverket - øk søkeresultater og bruk mindre strenge kriterier  
        fetch(`https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodeURIComponent(query.trim())}&treffPerSide=15&side=0&fuzzy=true&navnetype=*&kommunenavn=*`)
          .catch(() => null),
        // Alternativt søk med wildcard for delvise treff
        query.length >= 3 ? 
          fetch(`https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodeURIComponent(query.trim())}*&treffPerSide=10&side=0&fuzzy=false`)
            .catch(() => null) : 
          null
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
      
      // Behandle hovedsøk for steder
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
      
      // Behandle alternativt søk
      if (alternativeResponse?.ok) {
        try {
          const altData: PlaceResponse = await alternativeResponse.json();
          const altPlaces: PlaceSuggestion[] = altData.navn?.map(place => ({
            ...place,
            displayText: `${place.stedsnavn}${place.kommunenavn ? `, ${place.kommunenavn}` : ''}${place.fylkesnavn ? `, ${place.fylkesnavn}` : ''}`,
            type: 'place' as const
          })) || [];
          
          // Legg til kun nye resultater som ikke allerede finnes
          altPlaces.forEach(altPlace => {
            const exists = allSuggestions.some(existing => 
              existing.type === 'place' && 
              (existing as PlaceSuggestion).stedsnavn.toLowerCase() === altPlace.stedsnavn.toLowerCase()
            );
            if (!exists) {
              allSuggestions.push(altPlace);
            }
          });
        } catch (e) {
          console.warn('Feil ved parsing av alternativt søk');
        }
      }
      
      // Sorter så steder kommer først, deretter adresser
      allSuggestions.sort((a, b) => {
        if (a.type === 'place' && b.type === 'address') return -1;
        if (a.type === 'address' && b.type === 'place') return 1;
        return 0;
      });
      
      setSuggestions(allSuggestions.slice(0, 12)); // Øk til 12 totalt
    } catch (error) {
      console.error('Feil ved søk:', error);
      
      // Utvidet fallback til lokal søk hvis API feiler
      const expandedFallback = [...norwegianPlaces, ...norwegianCities, ...additionalNorwegianPlaces]
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
      
      setSuggestions(expandedFallback);
      
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

// Ytterligere småsteder og øyer som ofte ikke finnes i API-ene  
const additionalNorwegianPlaces = [
  "Kvalsvik", "Kvalsvik Nerlandsøy", "Nerlandsøy", "Nerlandsøya",
  "Giske", "Godøy", "Valderøy", "Vigra", "Ellingsøy", "Hjørundfjord",
  "Sykkylven", "Stranda", "Ørsta", "Volda", "Fosnavåg", "Runde",
  "Herøy Møre og Romsdal", "Sande Møre og Romsdal", "Vanylven", "Ulstein",
  "Hareid", "Ørskog", "Vestnes", "Rauma", "Nesset", "Sunndal",
  "Tingvoll", "Gjemnes", "Averøy", "Eide", "Frei", "Kristiansund N",
  "Smøla", "Aure", "Halsa", "Surnadal", "Rindal", "Orkdal",
  "Meldal", "Agdenes", "Snillfjord", "Hemne", "Rissa", "Leksvik",
  "Mosvik", "Inderøy", "Steinkjer", "Snåsa", "Lierne", "Røyrvik",
  "Namsskogan", "Grong", "Høylandet", "Overhalla", "Fosnes", "Flatanger",
  "Vikna", "Nærøy", "Leka", "Bindal", "Sømna", "Brønnøy", "Vega",
  "Vevelstad", "Herøy Nordland", "Alstahaug", "Leirfjord", "Vefsn",
  "Grane", "Hattfjelldal", "Dønna", "Nesna", "Hemnes", "Rana",
  "Lurøy", "Træna", "Rødøy", "Meløy", "Gildeskål", "Beiarn", "Saltdal",
  "Fauske", "Sørfold", "Steigen", "Hamarøy", "Tysfjord", "Lødingen",
  "Tjeldsund", "Evenes", "Ballangen", "Røst", "Værøy", "Flakstad",
  "Vestvågøy", "Vågan", "Hadsel", "Bø Nordland", "Øksnes", "Sortland",
  "Andøy", "Moskenes", "Svolvaer", "Kabelvåg", "Henningsvær", "Nusfjord"
];