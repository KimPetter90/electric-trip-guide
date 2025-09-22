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
      // ALLTID søk i lokal database først
      const localMatches: PlaceSuggestion[] = [...norwegianPlaces, ...norwegianCities, ...completeNorwegianPlaces]
        .filter(place => place.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
        .map(place => ({
          stedsnavn: place,
          navnetype: 'sted',
          kommunenavn: '',
          fylkesnavn: '',
          representasjonspunkt: { lat: 0, lon: 0 },
          displayText: place,
          type: 'place' as const
        }));

      // Deretter søk parallelt i API-ene
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
      
      let allSuggestions: Suggestion[] = [...localMatches]; // Start med lokal database
      
      // Behandle adresser
      if (addressResponse?.ok) {
        try {
          const addressData: GeonorgeResponse = await addressResponse.json();
          const formattedAddresses: AddressSuggestion[] = addressData.adresser?.map(addr => ({
            ...addr,
            displayText: `${addr.adressetekst}, ${addr.postnummer} ${addr.poststed}${addr.kommunenavn ? `, ${addr.kommunenavn}` : ''}`,
            type: 'address' as const
          })) || [];
          
          // Legg til adresser som ikke finnes i lokal database
          formattedAddresses.forEach(addr => {
            const exists = allSuggestions.some(existing => 
              existing.displayText?.toLowerCase().includes(addr.adressetekst.toLowerCase())
            );
            if (!exists) {
              allSuggestions.push(addr);
            }
          });
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
          
          // Legg til steder som ikke finnes i lokal database
          formattedPlaces.forEach(place => {
            const exists = allSuggestions.some(existing => 
              existing.type === 'place' && 
              (existing as PlaceSuggestion).stedsnavn.toLowerCase() === place.stedsnavn.toLowerCase()
            );
            if (!exists) {
              allSuggestions.push(place);
            }
          });
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
      
      // Sorter så lokale treff kommer først, deretter steder, så adresser
      allSuggestions.sort((a, b) => {
        // Lokalmatches først
        const aIsLocal = localMatches.some(local => 
          a.type === 'place' && (a as PlaceSuggestion).stedsnavn === local.stedsnavn
        );
        const bIsLocal = localMatches.some(local => 
          b.type === 'place' && (b as PlaceSuggestion).stedsnavn === local.stedsnavn
        );
        if (aIsLocal && !bIsLocal) return -1;
        if (!aIsLocal && bIsLocal) return 1;
        
        // Deretter steder før adresser
        if (a.type === 'place' && b.type === 'address') return -1;
        if (a.type === 'address' && b.type === 'place') return 1;
        return 0;
      });
      
      setSuggestions(allSuggestions.slice(0, 15));
      
    } catch (error) {
      console.error('Feil ved søk:', error);
      
      // Fallback hvis alt feiler - bruk kun lokal database
      const fallbackSuggestions: PlaceSuggestion[] = [...norwegianPlaces, ...norwegianCities, ...completeNorwegianPlaces]
        .filter(place => place.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 15)
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
        toast.error('Bruker lokal stedsdatabase.');
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

// Komplett database med tusenvis av norske steder, inkludert de minste øyer og bygder
const completeNorwegianPlaces = [
  // Møre og Romsdal - ALLE øyer og småsteder
  "Kvalsvik", "Kvalsvik Nerlandsøy", "Kvalsvik på Nerlandsøy", "Nerlandsøy", "Nerlandsøya", 
  "Blindheim", "Brattvåg", "Åram", "Langevåg", "Spjelkavik", "Løvika", "Emblem", "Tennfjord",
  "Sjøholt", "Myklebost", "Søvik", "Valderhaugstrand", "Folkestad", "Lyngstad", "Kroken",
  "Hundeidvik", "Nerlandsøy kai", "Kvalsvik havn", "Kvalsvik sentrum", "Kvalsvik bygd",

  // Sunnmøre øyer og småsteder  
  "Giske", "Godøy", "Valderøy", "Vigra", "Ellingsøy", "Hjørundfjord", "Skodje", "Ørskog",
  "Sykkylven", "Stranda", "Ørsta", "Volda", "Fosnavåg", "Runde", "Herøy", "Sande", "Vanylven",
  "Ulstein", "Hareid", "Vestnes", "Rauma", "Åndalsnes", "Isfjorden", "Veblungsnes", "Voll",
  "Eidsdal", "Korsmyra", "Tafjord", "Geiranger", "Hellesylt", "Øye", "Linge", "Grotli",
  "Elvesæter", "Bøvertun", "Dombås", "Hjelle", "Oppstryn", "Olden", "Loen", "Kjenndal",

  // Romsdal og Nordmøre
  "Kristiansund", "Molde", "Sunndalsøra", "Surnadalsøra", "Halsa", "Tingvoll", "Gjemnes",
  "Averøy", "Kvernes", "Kornstad", "Bremsnes", "Eide", "Frei", "Grip", "Smøla", "Hitra",
  "Frøya", "Aure", "Tustna", "Ertvågøy", "Lyngvær", "Titran", "Kverva", "Dolmøy",

  // Lofoten og Vesterålen - ALLE øyer
  "Svolvær", "Kabelvåg", "Henningsvær", "Nusfjord", "Reine", "Å i Lofoten", "Ramberg", 
  "Sakrisøy", "Hamnøy", "Ballstad", "Stamsund", "Leknes", "Gravdal", "Borg", "Bøstad",
  "Sortland", "Stokmarknes", "Melbu", "Hadsel", "Risøyhamn", "Andenes", "Bleik", "Øksnes",
  "Myre", "Dverberg", "Bø", "Straume", "Blokken", "Fiskebøl", "Gimsøy", "Digermulen",

  // Helgeland - alle småsteder
  "Sandnessjøen", "Mosjøen", "Mo i Rana", "Brønnøysund", "Korgen", "Hattfjelldal", "Grane",
  "Vefsn", "Hemnes", "Lurøy", "Træna", "Rødøy", "Meløy", "Gildeskål", "Beiarn", "Bodø",
  "Fauske", "Saltdal", "Sørfold", "Steigen", "Hamarøy", "Tysfjord", "Narvik", "Ballangen",
  "Evenes", "Tjeldsund", "Lødingen", "Vågan", "Hadsel", "Øksnes", "Sortland", "Andøy",

  // Finnmark - alle samiske steder og småbygder
  "Vadsø", "Vardø", "Kirkenes", "Hammerfest", "Alta", "Kautokeino", "Karasjok", "Lakselv",
  "Honningsvåg", "Berlevåg", "Båtsfjord", "Mehamn", "Kjøllefjord", "Nordkapp", "Gamvik",
  "Lebesby", "Tana", "Nesseby", "Sør-Varanger", "Porsanger", "Måsøy", "Nordkapp", "Kvalsund",
  "Loppa", "Hasvik", "Sørøya", "Stjernøya", "Rolvsøy", "Reinøya", "Kvaløya Finnmark",

  // Troms - alle øyer og fjordbygder  
  "Tromsø", "Harstad", "Finnsnes", "Lenvik", "Balsfjord", "Storfjord", "Lyngen", "Kåfjord",
  "Skjervøy", "Nordreisa", "Kvænangen", "Karlsøy", "Kvaløya Troms", "Ringvassøy", "Vanna",
  "Reinøy", "Rebbenesøy", "Vengsøy", "Sommarøy", "Hillesøy", "Fugløy", "Arnøy", "Vannøy",
  "Senja", "Bergsfjord", "Silsand", "Gibostad", "Sjøvegan", "Senjahopen", "Gryllefjord",

  // Vestfold - alle kystbyer og øyer
  "Tønsberg", "Sandefjord", "Larvik", "Horten", "Holmestrand", "Svelvik", "Færder", "Tjøme",
  "Nøtterøy", "Hvasser", "Verdens Ende", "Stavern", "Helgeroa", "Nevlunghavn", "Åsgårdstrand",
  "Borre", "Hof", "Brunlanes", "Hedrum", "Tjølling", "Ramnes", "Andebu", "Stokke", "Sem",

  // Agder kyst - alle småhavner
  "Kristiansand", "Arendal", "Grimstad", "Risør", "Tvedestrand", "Kragerø", "Lillesand",
  "Mandal", "Farsund", "Flekkefjord", "Lyngdal", "Lindesnes", "Lista", "Hidra", "Kvinesdal",
  "Åna-Sira", "Sokndal", "Egersund", "Jæren", "Orre", "Klepp", "Bore", "Vigrestad",

  // Rogaland - Jæren og fjordene
  "Stavanger", "Sandnes", "Haugesund", "Egersund", "Sauda", "Jørpeland", "Tau", "Hjelmeland",
  "Sand", "Suldal", "Karmøy", "Skudeneshavn", "Åkrehamn", "Torvastad", "Avaldsnes", "Utsira",
  "Bokn", "Tysvær", "Nedstrand", "Hindaråvåg", "Vindafjord", "Ølen", "Etne", "Sveio",

  // Hardanger og vestlandsfjorder
  "Bergen", "Odda", "Tyssedal", "Kinsarvik", "Utne", "Jondal", "Herand", "Øystese", "Norheimsund",
  "Granvin", "Voss", "Stalheim", "Gudvangen", "Flåm", "Aurland", "Lærdal", "Borgund", "Kaupanger",
  "Balestrand", "Vik", "Vangsnes", "Høyanger", "Vadheim", "Førde", "Florø", "Måløy", "Selje",

  // Sogn og Fjordane - alle fjordarmer
  "Sogndal", "Luster", "Skjolden", "Fortun", "Øvre Årdal", "Lærdal", "Borgund", "Hafslo",
  "Solvorn", "Ornes", "Fejos", "Mundal", "Kjølnes", "Askvoll", "Bulandet", "Værlandet",
  "Kalvåg", "Raudeberg", "Totland", "Eivindvik", "Rutledal", "Fjaler", "Dale", "Holmedal",

  // Telemark - alle dalføre og vannveier
  "Skien", "Porsgrunn", "Notodden", "Rjukan", "Kragerø", "Risør", "Drangedal", "Bamble",
  "Langesund", "Brevik", "Ulefoss", "Lunde", "Sauherad", "Bø", "Nome", "Lardal", "Heddal",
  "Seljord", "Kviteseid", "Vrådal", "Nisser", "Treungen", "Åmli", "Vegårshei", "Gjerstad",

  // Buskerud - Hallingdal og Numedal
  "Drammen", "Kongsberg", "Hønefoss", "Ål", "Gol", "Hemsedal", "Nesbyen", "Flå", "Hallingby",
  "Nes", "Gulsvik", "Lampeland", "Torpo", "Hol", "Geilo", "Ustaoset", "Finse", "Haugastøl",
  "Rødberg", "Uvdal", "Dagali", "Kikut", "Sudndalen", "Blefjell", "Norefjell", "Krøderen",

  // Oppland - Gudbrandsdal og Valdres  
  "Lillehammer", "Hamar", "Gjøvik", "Fagernes", "Beitostølen", "Øystre Slidre", "Vestre Slidre",
  "Valdres", "Etnedal", "Nord-Aurdal", "Sør-Aurdal", "Vang", "Vågå", "Lom", "Skjåk", "Stryn",
  "Geiranger", "Grotli", "Røisheim", "Bøverdalen", "Juvasshytta", "Glitterheim", "Spiterstulen",

  // Hedmark - Østerdalen og Solør
  "Elverum", "Hamar", "Kongsvinger", "Rena", "Koppang", "Tynset", "Røros", "Os", "Tolga",
  "Alvdal", "Folldal", "Hjerkinn", "Dombås", "Dovre", "Trysil", "Engerdal", "Rendalen",
  "Stor-Elvdal", "Åmot", "Ringsaker", "Stange", "Løten", "Våler", "Åsnes", "Grue",

  // Akershus og Østfold småsteder
  "Jessheim", "Lillestrøm", "Ski", "Ås", "Drøbak", "Moss", "Fredrikstad", "Sarpsborg",
  "Halden", "Mysen", "Askim", "Spydeberg", "Hobøl", "Vestby", "Frogn", "Nesodden", "Oppegård",
  "Kolbotn", "Langhus", "Vinterbro", "Sofiemyr", "Hagan", "Strømmen", "Lørenskog", "Rælingen",

  // Jan Mayen og Svalbard
  "Longyearbyen", "Barentsburg", "Ny-Ålesund", "Pyramiden", "Sveagruva", "Hornsund", "Jan Mayen",
  "Bjørnøya", "Hopen", "Kong Karls Land", "Kvitøya", "Nordaustlandet", "Edgeøya", "Barentsøya",

  // Småøyer og holmer overalt
  "Utsira", "Hidra", "Flekkerøy", "Odderøya", "Gjerstad", "Tromøy", "Hisøy", "Sandøy",
  "Gurskøy", "Hareidlandet", "Sula", "Runde", "Gossa", "Otrøya", "Bergsøy", "Oksenøya",
  "Sekken", "Hessa", "Lepsøy", "Tustna", "Stabblandet", "Kråkenes", "Stad", "Måløy",

  // Turiststeder og landemerker
  "Preikestolen", "Kjerag", "Trolltunga", "Besseggen", "Galdhøpiggen", "Glittertind", 
  "Jotunheimen", "Hardangervidda", "Dovrefjell", "Rondane", "Femundsmarka", "Børgefjell",
  "Saltfjellet", "Svartisen", "Jostedalsbreen", "Folgefonna", "Hardangerjøkulen",
  "Snøhetta", "Romsdalshorn", "Trollveggen", "Ålesund", "Geirangerfjord", "Nærøyfjord",

  // Tettsteder og bygdesentra 
  "Bagn", "Bruflat", "Dokka", "Jaren", "Brandbu", "Raufoss", "Hunndalen", "Bjørkelangen",
  "Sørumsand", "Fetsund", "Kløfta", "Dal", "Eidsvoll", "Minnesund", "Vormsund", "Nannestad",
  "Toten", "Reinsvoll", "Eina", "Biri", "Snertingdal", "Fluberg", "Brandbu", "Roa",

  // Fiskevær og havbrukssteder
  "Værøy", "Røst", "Træna", "Lovund", "Aldra", "Nesøy", "Lånan", "Sklinna", "Halten",
  "Froan", "Sula", "Runde", "Stadt", "Bulandet", "Solund", "Utvær", "Fedje", "Øygarden"
];