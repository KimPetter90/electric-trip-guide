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
      // Søk parallelt i både adresser og steder med mange strategier
      const [addressResponse, placeResponse, alternativeResponse, exactResponse] = await Promise.all([
        // Adresser fra Kartverket
        fetch(`https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(query.trim())}&treffPerSide=20&side=0&asciiKompatibel=true`)
          .catch(() => null),
        // Steder/stedsnavn fra Kartverket - maksimalt søk 
        fetch(`https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodeURIComponent(query.trim())}&treffPerSide=50&side=0&fuzzy=true`)
          .catch(() => null),
        // Alternativt søk med wildcard for delvise treff
        query.length >= 3 ? 
          fetch(`https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodeURIComponent(query.trim())}*&treffPerSide=30&side=0&fuzzy=false`)
            .catch(() => null) : 
          null,
        // Eksakt søk uten fuzzy
        fetch(`https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodeURIComponent(query.trim())}&treffPerSide=20&side=0&fuzzy=false`)
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

      // Behandle eksakt søk
      if (exactResponse?.ok) {
        try {
          const exactData: PlaceResponse = await exactResponse.json();
          const exactPlaces: PlaceSuggestion[] = exactData.navn?.map(place => ({
            ...place,
            displayText: `${place.stedsnavn}${place.kommunenavn ? `, ${place.kommunenavn}` : ''}${place.fylkesnavn ? `, ${place.fylkesnavn}` : ''}`,
            type: 'place' as const
          })) || [];
          
          // Legg til kun nye resultater som ikke allerede finnes
          exactPlaces.forEach(exactPlace => {
            const exists = allSuggestions.some(existing => 
              existing.type === 'place' && 
              (existing as PlaceSuggestion).stedsnavn.toLowerCase() === exactPlace.stedsnavn.toLowerCase()
            );
            if (!exists) {
              allSuggestions.push(exactPlace);
            }
          });
        } catch (e) {
          console.warn('Feil ved parsing av eksakt søk');
        }
      }
      
      // Sorter så steder kommer først, deretter adresser
      allSuggestions.sort((a, b) => {
        if (a.type === 'place' && b.type === 'address') return -1;
        if (a.type === 'address' && b.type === 'place') return 1;
        return 0;
      });
      
      setSuggestions(allSuggestions.slice(0, 15)); // Øk til 15 totalt
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

// Utvidet database med norske steder organisert etter fylke
const additionalNorwegianPlaces = [
  // Møre og Romsdal - spesielt småsteder og øyer
  "Kvalsvik", "Kvalsvik Nerlandsøy", "Nerlandsøy", "Nerlandsøya", "Blindheim", "Brattvåg",
  "Giske", "Godøy", "Valderøy", "Vigra", "Ellingsøy", "Hjørundfjord", "Skodje", "Ørskog",
  "Sykkylven", "Stranda", "Ørsta", "Volda", "Fosnavåg", "Runde", "Åram", "Langevåg",
  "Herøy Møre og Romsdal", "Sande Møre og Romsdal", "Vanylven", "Ulstein", "Hareid",
  "Vestnes", "Rauma", "Nesset", "Sunndal", "Tingvoll", "Gjemnes", "Averøy", "Eide",
  "Frei", "Kristiansund N", "Smøla", "Aure", "Halsa", "Surnadal", "Rindal",
  "Flemsøy", "Tomrefjord", "Tafjord", "Geiranger", "Dalsnibba", "Trollstigen",

  // Nordland
  "Bindal", "Sømna", "Brønnøy", "Vega", "Vevelstad", "Herøy Nordland", "Alstahaug",
  "Leirfjord", "Vefsn", "Grane", "Hattfjelldal", "Dønna", "Nesna", "Hemnes", "Rana",
  "Lurøy", "Træna", "Rødøy", "Meløy", "Gildeskål", "Beiarn", "Saltdal", "Fauske",
  "Sørfold", "Steigen", "Hamarøy", "Tysfjord", "Lødingen", "Tjeldsund", "Evenes",
  "Ballangen", "Røst", "Værøy", "Flakstad", "Vestvågøy", "Vågan", "Hadsel",
  "Bø Nordland", "Øksnes", "Sortland", "Andøy", "Moskenes", "Svolvær", "Kabelvåg",
  "Henningsvær", "Nusfjord", "Reine", "Å i Lofoten", "Ramberg", "Sakrisøy",

  // Troms og Finnmark  
  "Karlsøy", "Lyngen", "Storfjord", "Kåfjord", "Skjervøy", "Nordreisa", "Kvænangen",
  "Lebesby", "Gamvik", "Berlevåg", "Tana", "Nesseby", "Båtsfjord", "Sør-Varanger",
  "Vadsø", "Vardø", "Kirkenes", "Honningsvåg", "Lakselv", "Kautokeino", "Karasjok",
  "Porsanger", "Nordkapp", "Måsøy", "Hammerfest", "Kvalsund", "Loppa", "Hasvik",

  // Vestfold og Telemark
  "Horten", "Holmestrand", "Tønsberg", "Sandefjord", "Larvik", "Færder", "Tjøme",
  "Nøtterøy", "Svelvik", "Drammen", "Kongsberg", "Ringerike", "Hole", "Flå", "Nes",
  "Gol", "Hemsedal", "Ål", "Hol", "Sigdal", "Krødsherad", "Modum", "Øvre Eiker",
  "Nedre Eiker", "Lier", "Røyken", "Hurum", "Porsgrunn", "Skien", "Notodden",
  "Siljan", "Bamble", "Kragerø", "Drangedal", "Nome", "Midt-Telemark", "Tinn",
  "Hjartdal", "Seljord", "Kviteseid", "Nissedal", "Fyresdal", "Tokke", "Vinje",

  // Agder (Vest-Agder og Aust-Agder)
  "Risør", "Grimstad", "Arendal", "Gjerstad", "Vegårshei", "Tvedestrand", "Froland",
  "Lillesand", "Birkenes", "Åmli", "Iveland", "Evje og Hornnes", "Bygland", "Valle",
  "Bykle", "Kristiansand", "Mandal", "Farsund", "Flekkefjord", "Vennesla", "Songdalen",
  "Søgne", "Marnardal", "Åseral", "Audnedal", "Lindesnes", "Lyngdal", "Hægebostad",
  "Kvinesdal", "Sirdal", "Lista", "Eigersund", "Sokndal",

  // Rogaland  
  "Eigersund", "Stavanger", "Haugesund", "Sandnes", "Sokndal", "Lund", "Bjerkreim",
  "Hå", "Klepp", "Time", "Gjesdal", "Sola", "Randaberg", "Forsand", "Strand",
  "Hjelmeland", "Suldal", "Sauda", "Finnøy", "Rennesøy", "Kvitsøy", "Bokn", "Tysvær",
  "Karmøy", "Utsira", "Haugesund", "Vindafjord", "Etne", "Sveio", "Jæren", "Preikestolen",

  // Vestland (Hordaland og Sogn og Fjordane)
  "Bergen", "Kinn", "Etne", "Sveio", "Bømlo", "Stord", "Fitjar", "Tysnes", "Kvinnherad",
  "Jondal", "Odda", "Ullensvang", "Eidfjord", "Ulvik", "Granvin", "Voss", "Kvam",
  "Samnanger", "Bjørnafjorden", "Austevoll", "Øygarden", "Askøy", "Vaksdal", "Modalen",
  "Osterøy", "Alver", "Radøy", "Lindås", "Meland", "Øygarden", "Fedje", "Masfjorden",
  "Gulen", "Solund", "Hyllestad", "Høyanger", "Vik", "Balestrand", "Leikanger", "Sogndal",
  "Aurland", "Lærdal", "Årdal", "Luster", "Askvoll", "Fjaler", "Gaular", "Jølster",
  "Førde", "Naustdal", "Bremanger", "Vågsøy", "Selje", "Eid", "Hornindal", "Gloppen",
  "Stryn", "Flåm", "Geiranger", "Nærøyfjord", "Sognefjord", "Hardangerfjord",

  // Innlandet (Oppland og Hedmark)
  "Kongsvinger", "Hamar", "Lillehammer", "Gjøvik", "Ringsaker", "Løten", "Stange",
  "Nord-Odal", "Sør-Odal", "Eidskog", "Grue", "Åsnes", "Våler Innlandet", "Elverum",
  "Trysil", "Åmot", "Stor-Elvdal", "Rendalen", "Engerdal", "Tolga", "Tynset", "Alvdal",
  "Folldal", "Os Innlandet", "Dovre", "Lesja", "Skjåk", "Lom", "Vågå", "Nord-Fron",
  "Sel", "Sør-Fron", "Ringebu", "Øyer", "Gausdal", "Østre Toten", "Vestre Toten",
  "Jevnaker", "Lunner", "Gran", "Søndre Land", "Nordre Land", "Sør-Aurdal", "Etnedal",
  "Nord-Aurdal", "Vestre Slidre", "Øystre Slidre", "Vang", "Lillehammer OL",

  // Viken (Akershus, Østfold, Buskerud)
  "Aremark", "Marker", "Indre Østfold", "Skiptvet", "Rakkestad", "Råde", "Rygge",
  "Våler Østfold", "Vestby", "Ås", "Frogn", "Nesodden", "Oppegård", "Enebakk",
  "Lørenskog", "Rælingen", "Aurskog-Høland", "Gjerdrum", "Ullensaker", "Nes",
  "Eidsvoll", "Nannestad", "Hurdal", "Lillestrøm", "Nittedal", "Bærum", "Asker",
  "Øvre Eiker", "Nedre Eiker", "Lier", "Flesberg", "Rollag", "Nore og Uvdal",
  "Gardermoen", "Jessheim", "Ski", "Oppegård", "Kolbotn", "Langhus",

  // Småsteder, tettsteder og landemerker
  "Rjukan", "Røros", "Longyearbyen", "Ny-Ålesund", "Barentsburg", "Pyramiden",
  "Molde Panorama", "Atlanterhavsveien", "Trolltunga", "Besseggen", "Galdhøpiggen",
  "Jotunheimen", "Dovrefjell", "Rondane", "Hardangervidda", "Finse", "Myrdal",
  "Åndalsnes", "Romsdalen", "Valdres", "Gudbrandsdalen", "Østerdalen", "Hallingdal",
  "Numedal", "Setesdal", "Hardanger", "Sunnhordland", "Nordhordland", "Sunnfjord",
  "Nordfjord", "Sunnmøre", "Romsdal", "Nordmøre", "Fosen", "Namdalen", "Salten",
  "Ofoten", "Vesterålen", "Lofoten", "Senja", "Kvaløya", "Magerøya"
];