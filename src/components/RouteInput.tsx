import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { MapPin, Truck, Route, Battery, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Norske byer, tettsteder og bygder for autocomplete - med fylke/region for oversikt
const norwegianCities = [
  // Oslo og Viken (tidligere Akershus, Buskerud, Østfold)
  "oslo (oslo)", "drammen (viken)", "fredrikstad (viken)", "moss (viken)", 
  "sarpsborg (viken)", "halden (viken)", "sandefjord (viken)", "tønsberg (viken)",
  "kongsberg (viken)", "asker (viken)", "bærum (viken)", "ski (viken)", 
  "lørenskog (viken)", "ås (viken)", "oppegård (viken)", "rælingen (viken)",
  "skedsmo (viken)", "sørum (viken)", "eidsvoll (viken)", "gjerdrum (viken)",
  "hurdal (viken)", "nannestad (viken)", "nes (viken)", "frogn (viken)",
  "vestby (viken)", "enebakk (viken)", "aurskog-høland (viken)", "marker (viken)",
  "spydeberg (viken)", "askim (viken)", "eidsberg (viken)", "skiptvet (viken)",
  "rakkestad (viken)", "råde (viken)", "rygge (viken)", "våler (viken)",
  "hobøl (viken)", "aremark (viken)", "kongsvinger (viken)", "rømskog (viken)",
  "horten (viken)", "åsgårdstrand (viken)", "tjøme (viken)", "nøtterøy (viken)",
  "larvik (viken)", "stavern (viken)", "modum (viken)", "øvre eiker (viken)",
  "nedre eiker (viken)", "lier (viken)", "røyken (viken)", "hurum (viken)",
  "flesberg (viken)", "rollag (viken)", "sigdal (viken)", "hole (viken)",
  "ringerike (viken)", "jevnaker (viken)",

  // Innlandet (tidligere Hedmark og Oppland)
  "lillehammer (innlandet)", "hamar (innlandet)", "elverum (innlandet)", 
  "gjøvik (innlandet)", "tynset (innlandet)", "alvdal (innlandet)", 
  "folldal (innlandet)", "os (innlandet)", "dovre (innlandet)", "lesja (innlandet)",
  "skjåk (innlandet)", "lom (innlandet)", "vågå (innlandet)", "sel (innlandet)",
  "nord-fron (innlandet)", "sør-fron (innlandet)", "ringebu (innlandet)", 
  "øyer (innlandet)", "gausdal (innlandet)", "østre toten (innlandet)", 
  "vestre toten (innlandet)", "lunner (innlandet)", "gran (innlandet)",
  "søndre land (innlandet)", "nordre land (innlandet)", "sør-aurdal (innlandet)",
  "etnedal (innlandet)", "nord-aurdal (innlandet)", "vestre slidre (innlandet)",
  "øystre slidre (innlandet)", "vang (innlandet)", "fagernes (innlandet)",
  "raufoss (innlandet)", "vinstra (innlandet)", "dombås (innlandet)", 
  "kvam (innlandet)", "beitostølen (innlandet)", "valdres (innlandet)",
  "røros (innlandet)", "tolga (innlandet)", "hjerkinn (innlandet)",
  "kongsvold (innlandet)", "fokstugu (innlandet)", "oppdal (innlandet)",
  "brandbu (innlandet)", "dokka (innlandet)", "nord-torpa (innlandet)",
  "øilo (innlandet)", "bruflat (innlandet)", "nordsinni (innlandet)",
  "slidre (innlandet)", "bagn (innlandet)", "bjørgo (innlandet)",
  "tyinkrysset (innlandet)", "filefjell (innlandet)", "tyin (innlandet)",
  "eidsbugarden (innlandet)", "bygdin (innlandet)", "gjendesheim (innlandet)",
  "maurvangen (innlandet)", "bessheim (innlandet)", "krossbu (innlandet)",
  "leirvassbu (innlandet)", "glitterheim (innlandet)", "spiterstulen (innlandet)",
  "brekken (innlandet)", "glåmos (innlandet)",

  // Agder (tidligere Aust-Agder og Vest-Agder)
  "kristiansand (agder)", "arendal (agder)", "mandal (agder)", "grimstad (agder)",
  "lillesand (agder)", "flekkefjord (agder)", "vennesla (agder)", "søgne (agder)",
  "songdalen (agder)", "birkenes (agder)", "åmli (agder)", "åseral (agder)",
  "audnedal (agder)", "lindesnes (agder)", "marnardal (agder)", "lyngdal (agder)",
  "hægebostad (agder)", "kvinesdal (agder)", "sirdal (agder)", "farsund (agder)",
  "bygland (agder)", "valle (agder)", "bykle (agder)", "evje og hornnes (agder)",
  "iveland (agder)", "froland (agder)", "tvedestrand (agder)", "risør (agder)",
  "vegårshei (agder)", "gjerstad (agder)", "nissedal (agder)", "hovden (agder)",
  "setesdal (agder)", "lista (agder)", "spangereid (agder)", "vigeland (agder)",
  "evje (agder)", "lyngør (agder)", "helgeroa (agder)", "nevlunghavn (agder)",
  "borgund", "lærdalsøyri", "kaupanger", "gaupne", "skjolden", "fortun",
  "øvre årdal", "tyin", "eidsbugarden", "bygdin", "gjendesheim", "maurvangen",
  "bessheim", "krossbu", "leirvassbu", "glitterheim", "spiterstulen",
  "preikestolen", "lysebotn", "flørli", "forsand", "fister", "tau",
  "jørpeland", "rennesøy", "sjernarøy", "nedstrand", "ombo", "vikevåg",
  "skudeneshavn", "avaldsnes", "kopervik", "åkrehamn", "skjold", "tysvær",
  "haugesund", "raglamyr", "torvastad", "bokn", "utsira", "vibrandsøy",
  
  // Småbygder - Telemark
  "rjukan", "notodden", "kragsjø", "åmotsdal", "sauland", "akkerhaugen",
  "bø", "sauherad", "krossobanen", "gaustablikk", "tuddal", "hjartdal",
  "seljord", "kviteseid", "vrådal", "dalen", "åmli", "vegårshei",
  "gjerstad", "kragerø", "portør", "stabbestad", "jomfruland", "langøy",
  "hvaler", "skjeberg", "ørje", "magnor", "prestebakke", "tistedal",
  "sponvika", "skulerud", "rødenes", "kornsjø", "ed", // Fjernet duplikat: berg finnes allerede
  
  // Småbygder - Agder
  "mandal", "spangereid", "vigeland", "åseral", "bygland", "valle",
  "bykle", "hovden", "setesdal", "evje", "iveland", "vennesla",
  "kristiansand", "søgne", "songdalen", "lillesand", "grimstad", "arendal",
  "tvedestrand", "risør", "gjerstad", "vegårshei", "åmli", "froland",
  "nissedal", "drangedal", "kragerø", "bamble", "porsgrunn", "skien",
  "flekkefjord", "farsund", "lyngdal", "audnedal", "lindesnes", "mandal",
  "marnardal", "åseral", "kvinesdal", "sirdal", "hægebostad", "lyngdal",
  
  // Småbygder - Rogaland
  "egersund", "sokndal", "lund", "bjerkreim", "gjesdal", "time",
  "klepp", "hå", "varhaug", "nærbø", "bryne", "figgjo", "ålgård",
  "sandnes", "sola", "tananger", "stavanger", "hundvåg", "madla",
  "hafrsfjord", "tau", "jørpeland", "strand", "hjelmeland", "sauda",
  "suldal", "røldal", "odda", "ullensvang", "kinsarvik", "lofthus",
  "utne", "jondal", "herand", "norheimsund", "steinsto", "trengereid",
  
  // Småbygder - Hordaland/Vestland
  "bergen", "fana", "ytrebygda", "åsane", "arna", "indre arna",
  "askøy", "kleppestø", "florvåg", "sund", "kausland", "austevoll",
  "storebø", "bekkjarvik", "bømlo", "langevåg", "svortland", "stord",
  "leirvik", "sagvåg", "fitjar", "skånevik", "etne", "ølen",
  "kvinnherad", "husnes", "sunde", "rosendal", "jondal", "herand",
  "norheimsund", "kvam", "øystese", "steinsto", "trengereid", "granvin",
  "ulvik", "eidfjord", "øvre eidfjord", "kinsarvik", "lofthus", "utne",
  
  // Småbygder - Sogn og Fjordane
  "førde", "naustdal", "jølster", "skei", "vassenden", "florø",
  "måløy", "vågsøy", "selje", "bremanger", "kalvåg", "rugsund",
  "stryn", "loen", "olden", "innvik", "utvik", "gloppen", "sandane",
  "eid", "nordfjordeid", "hornindal", "grodås", "bryggja", "utfjord",
  "sogndal", "kaupanger", "lærdalsøyri", "borgund", "aurland", "flåm",
  "gudvangen", "voss", "stalheim", "myrdal", "finse", "haugastøl",
  "ustaoset", "geilo", "gol", "nesbyen", "ål", "torpo", "hol",
  
  // Småbygder - Møre og Romsdal
  "ålesund", "godøy", "giske", "vigra", "valderøy", "borgundgavlen",
  "spjelkavik", "moa", "blindheim", "ulsteinvik", "hareid", "ørsta",
  "volda", "ørskog", "sjøholt", "stordal", "norddal", "geiranger",
  "valldal", "sylte", "stranda", "hellesylt", "øye", "linge",
  "tafjord", "andalsnes", "åndalsnes", "isfjorden", "trollstigen",
  "dombås", "lesja", "lesjaskog", "dovre", "hjerkinn", "kongsvold",
  "fokstugu", "oppdal", "drivstua", "berkåk", "løkken verk", "meldal",
  "orkanger", "fannrem", "brekstad", "rissa", "leksvik", "mosvik",
  
  // Småbygder - Trøndelag
  "røros", "brekken", "glåmos", "os", "tolga", "tynset", "alvdal",
  "folldal", "hjerkinn", "kongsvold", "oppdal", "støren", "melhus",
  "gauldal", "skaun", "børsa", "buvik", "orkanger", "fannrem",
  "brekstad", "rissa", "leksvik", "mosvik", "inderøy", "straumen",
  "røra", "sakshaug", "steinkjer", "snåsa", "grong", "namsos",
  "bangsund", "overhalla", "høylandet", "lierne", "røyrvik", "gartland",
  
  // Småbygder - Nordland
  "mo i rana", "mosjøen", "sandnessjøen", "brønnøysund", "rørvik",
  "namsos", "bangsund", "kolvereid", "nærøy", "vikna", "bindal",
  "sømna", "brønnøy", "vega", "vevelstad", "herøy", "dønna",
  "nesna", "hemnes", "korgen", "trofors", "grong", "namsos",
  "overhalla", "høylandet", "foldereid", "leka", "gutvik", "rørvik",
  "kolvereid", "nærøy", "vikna", "bindal", "terråk", "sømna",
  "brønnøysund", "hommelstø", "velfjord", "vega", "gladstad", "ylvingen",
  "vevelstad", "herøy", "sandnessjøen", "dønna", "solfjellsjøen", "løkta",
  "nesna", "eiterå", "hemnes", "korgen", "rana", "mo i rana",
  "storforshei", "utskarpen", "selfors", "hattfjelldal", "susendal", "grane",
  "majavatn", "trofors", "leir", "vefsn", "mosjøen", "elsfjord",
  "drevja", "leirfjord", "leland", "alstahaug", "sandnessjøen", "helgeland",
  
  // Småbygder - Lofoten og Vesterålen
  "svolvær", "kabelvåg", "henningsvær", "stamsund", "ballstad", "leknes",
  "gravdal", "ramberg", "flakstad", "nusfjord", "reine", "sakrisøy",
  "hamnøy", "tind", "å", "moskenes", "sørvågen", "værøy", "røst",
  "myre", "stokmarknes", "melbu", "sortland", "andenes", "bleik",
  "nyksund", "vesterålen", "risøyhamn", "andøy", "dverberg", "øksnes", // Fjernet duplikat: bø finnes allerede flere steder
  "langenes", "hadsel", "fiskebøl", // Fjernet duplikater: stokmarknes og melbu finnes allerede
  
  // Småbygder - Troms
  "tromsø", "kvaløysletta", "sommarøy", "ersfjord", "kroken", "tromvik",
  "lyngseidet", "furuflaten", "svensby", "olderdalen", "skibotn", "kilpisjärvi",
  "nordkjosbotn", "sørkjosen", "birtavarre", "rotsund", "nordreisa",
  "storslett", "kvænangen", "burfjord", "nord-lenangen", "kåfjord",
  "alteidet", "skjervøy", "arnøyhamn", "akkarvik", "uløya", "loppa",
  "øksfjord", "bergsfjord", "hasvik", "hammerfest", "rypefjord", "kvalsund",
  "olderfjord", "alta", "bossekop", "elvebakken", "kautokeino", "máze",
  "karasjok", "sirma", "tana bru", "polmak", "nesseby", "varangerbotn",
  "vadsø", "krampenes", "vardø", "hamningberg", "båtsfjord", "berlevåg",
  
  // Småbygder - Finnmark
  "lakselv", "ifjord", "børselv", "stabbursdalen", "karigasniemi", "utsjoki",
  // Fjernet duplikater: "kvalsvik, nerlandsøy" finnes allerede som "kvalsvik (nerlandsøy)" under
  "nuorgam", "sirma", "deanu", // Fjernet duplikater: polmak, tana bru, karasjok, máze, kautokeino finnes allerede
  "guovdageaidnu", "kåfjord", "kvænangen", // Fjernet duplikater: alta finnes allerede
  "storfjord", "lyngen", "balsfjord", "målselv", "bardu", "gratangen",
  "ibestad", "harstad", "kvæfjord", "sortland", "andøy", "vesterålen",
  "lofoten", "flakstad", "moskenes", "vestvågøy", "vågan", "austvågøy",
  
  // Mer småsteder spredt rundt
  "horten", "åsgårdstrand", "tjøme", "verdens ende", "nøtterøy", "tønsberg",
  "sandefjord", "larvik", "stavern", "helgeroa", "nevlunghavn", "langesund",
  "brevik", "stathelle", "kragerø", "portør", "stabbestad", "jomfruland",
  "lyngør", "tvedestrand", "arendal", "grimstad", "lillesand", "kristiansand",
  "vennesla", "mandal", "lindesnes", "farsund", "lista", "flekkefjord",
  "sokndal", "egersund", "hellvik", "ogna", "sirevåg", "hå", "varhaug",
  "nærbø", "bryne", "klepp", "orre", "sola", "tananger", "stavanger",
  "randaberg", "rennesøy", "tau", "jørpeland", "preikestolen", "lysefjord",
  "forsand", "hjelmeland", "ombo", "sauda", "røldal", "odda", "trolltunga",
  "låtefoss", "skjeggedal", "tyssedal", "eidfjord", "voringsfoss", "hardanger",
  "ulvik", "granvin", "voss", "myrdal", "flåm", "aurland", "lærdal",
  "borgund", "kaupanger", "balestrand", "sogndal", "luster", "skjolden",
  "fortun", "øvre årdal", "årdal", "askvoll", "florø", "måløy", "torvik",
  "ørsta", "volda", "ulsteinvik", "hareid", "ålesund", "giske", "godøy",
  "skodje", "ørskog", "stordal", "stranda", "geiranger", "dalsnibba",
  "trollstigen", "andalsnes", "åak", "valldal", "tafjord", "norangsdal",
  
  // Enda flere småbygder og grender
  "feios", "sjoa", "otta", "sel", "heidal", "bjølstad", "kvam", "sjodalen",
  "boverdalen", "galdhøpiggen", "leirvassbu", "fannaråken", "turtagrø", "fortun",
  "øvre årdal", "veitastrond", "hol", "ustaoset", "haugastøl", "finse",
  "myrdal", "berekvam", "voss", "skulestadmo", "stalheim", "gudvangen",
  "flåm", "aurlandsvangen", "lærdal", "borgund", "filefjell", "tyinkrysset",
  "bygdin", "maurvangen", "gjendesheim", "bessheim", "gjendebu", "memurubu",
  "sikkilsdalen", "elveseter", "leirvassbu", "krossbu", "spiterstulen",
  "glitterheim", "bessvatnet", "rondslottet", "mysusæter", "høvringen",
  "rondablikk", "peer gynt", "lillehammer", "hafjell", "kvitfjell", "sjusjøen",
  "nordseter", "trysil", "engerdal", "røros", "femundsmarka", "femunden",
  "elgå", "alvdal", "tynset", "folldal", "hjerkinn", "dovre", "dombås",
  "lesja", "lesjaskog", "vågå", "lom", "skjåk", "bismo", "stryn",
  "loen", "olden", "briksdal", "kjenndalsbreen", "melkevoll", "oppstryn",
  "grotli", "geiranger", "dalsnibba", "ørnesvingen", "flydalsjuvet",
  "hellesylt", "hornindal", "grodås", "innvik", "utvik", "sandane",
  "førde", "naustdal", "florø", "måløy", "bremanger", "kalvåg", "rugsund",
  "selje", "vågsøy", "torvik", "ulsteinvik", "hareid", "ørsta", "volda",
  "ålesund", "giske", "godøy", "alnes", "spjelkavik", "moa", "blindheim",
  "sykkylven", "stranda", "hellesylt", "geiranger", "valldal", "tafjord",
  "norddal", "øye", "linge", "andalsnes", "trollstigen", "trollveggen",
  "isfjorden", "åndalsnes", "lesja", "dovre", "hjerkinn", "kongsvold",
  "focus", "oppdal", "støren", "melhus", "orkanger", "fannrem", "brekstad",
  "rissa", "leksvik", "mosvik", "inderøy", "straumen", "steinkjer", "snåsa",
  "grong", "namsos", "overhalla", "høylandet", "lierne", "røyrvik", "gartland",
  
  // Steder med stedsinformasjon for å skille duplikater
  "kvalsvik (nerlandsøy)", "kvålsvik (lyngdal)", "kvalvik (frei)", "kvalvik (utne)", "kvalvik (eikefjord)",
  "bø (nordland)", "bø (telemark)", "bø (vesterålen)", 
  "os (hordaland)", "os (hedmark)", "os (østfold)",
  "vågan (lofoten)", "vågan (oppland)",
  "berg (troms)", "berg (senja)"
];

interface RouteData {
  from: string;
  to: string;
  via?: string;
  trailerWeight: number;
  batteryPercentage: number;
  travelDate?: Date;
}

interface RouteInputProps {
  routeData: RouteData;
  onRouteChange: (data: RouteData) => void;
  onPlanRoute: () => void;
  isPlanning?: boolean; // Ny prop for loading state
}

export default function RouteInput({ routeData, onRouteChange, onPlanRoute, isPlanning = false }: RouteInputProps) {
  const [allCities, setAllCities] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Last inn lærte steder når komponenten starter
  useEffect(() => {
    const learnedCities = JSON.parse(localStorage.getItem('learnedCities') || '[]');
    const uniqueCities = [...new Set([...norwegianCities, ...learnedCities])].sort();
    setAllCities(uniqueCities);
  }, []);

  // Funksjon for å lagre nye steder
  const learnNewPlace = (place: string) => {
    const trimmedPlace = place.trim().toLowerCase();
    if (trimmedPlace && !allCities.includes(trimmedPlace)) {
      const learnedCities = JSON.parse(localStorage.getItem('learnedCities') || '[]');
      const updatedLearned = [...learnedCities, trimmedPlace];
      localStorage.setItem('learnedCities', JSON.stringify(updatedLearned));
      
      const newAllCities = [...allCities, trimmedPlace].sort();
      setAllCities(newAllCities);
    }
  };

  // Valideringsfunksjoner for å vise checkmarks
  const isValidLocation = (location: string): boolean => {
    if (!location || location.trim().length === 0) return false;
    const trimmedLocation = location.trim().toLowerCase();
    return allCities.some(city => city.toLowerCase() === trimmedLocation);
  };

  const isValidBatteryPercentage = (percentage: number): boolean => {
    return percentage > 0 && percentage <= 100;
  };

  const isValidTrailerWeight = (weight: number): boolean => {
    return weight >= 0 && weight <= 3500;
  };

  const handleInputChange = (field: keyof RouteData, value: string | number | Date) => {
    // Validering og sanitizing
    if ((field === 'from' || field === 'to' || field === 'via') && typeof value === 'string') {
      const sanitized = value.trim().slice(0, 50); // Begrenset lengde
      learnNewPlace(sanitized);
      value = sanitized;
    }
    
    if (field === 'batteryPercentage' && typeof value === 'number') {
      value = Math.max(0, Math.min(100, value)); // Sikre 0-100 range
    }
    
    if (field === 'trailerWeight' && typeof value === 'number') {
      value = Math.max(0, Math.min(3500, value)); // Sikre 0-3500 kg range
    }
    
    onRouteChange({
      ...routeData,
      [field]: value
    });
  };

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm border-border shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Route className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-2xl font-orbitron font-bold text-gradient animate-glow-pulse">Planlegg rute</h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Fra
            </Label>
            <AutocompleteInput
              id="from"
              placeholder=""
              value={routeData.from}
              onChange={(value) => handleInputChange('from', value)}
              suggestions={allCities}
              className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Til
            </Label>
            <AutocompleteInput
              id="to"
              placeholder=""
              value={routeData.to}
              onChange={(value) => handleInputChange('to', value)}
              suggestions={allCities}
              className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="via" className="flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              Via (valgfritt)
            </Label>
            <AutocompleteInput
              id="via"
              placeholder=""
              value={routeData.via || ''}
              onChange={(value) => handleInputChange('via', value)}
              suggestions={allCities}
              className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="battery" className="flex items-center gap-2">
            <Battery className="h-3 w-3" />
            Batteriprosent ved start
          </Label>
          <Input
            id="battery"
            type="number"
            placeholder=""
            value={routeData.batteryPercentage || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleInputChange('batteryPercentage', 0);
              } else {
                const numValue = parseInt(value);
                if (isNaN(numValue)) {
                  handleInputChange('batteryPercentage', 0);
                } else {
                  const finalValue = Math.max(0, Math.min(100, numValue));
                  handleInputChange('batteryPercentage', finalValue);
                }
              }
            }}
            className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
            min="1"
            max="100"
          />
          {routeData.batteryPercentage > 0 && (
            <Badge variant="outline" className="text-xs">
              {routeData.batteryPercentage}% batteri
            </Badge>
          )}
        </div>

        <div className="space-y-2">
            <Label htmlFor="trailer" className="flex items-center gap-2">
              <Truck className="h-3 w-3" />
              Hengervekt (kg)
            </Label>
          <Input
            id="trailer"
            type="number"
            placeholder="0"
            value={routeData.trailerWeight || ''}
            onChange={(e) => handleInputChange('trailerWeight', parseInt(e.target.value) || 0)}
            className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
          />
          {routeData.trailerWeight > 0 && (
            <Badge variant="outline" className="text-xs">
              +{Math.round(routeData.trailerWeight * 0.15)}% forbruk
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <CalendarIcon className="h-3 w-3" />
            Reisedato
          </Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-background/50 border-border hover:border-primary",
                  !routeData.travelDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {routeData.travelDate ? format(routeData.travelDate, "PPP") : "Velg reisedato"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={routeData.travelDate}
                onSelect={(date) => {
                  handleInputChange('travelDate', date || new Date());
                  setCalendarOpen(false);
                }}
                disabled={(date) => date < new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {routeData.travelDate && (
            <Badge variant="outline" className="text-xs">
              Værvarsel for {format(routeData.travelDate, "dd.MM.yyyy")}
            </Badge>
          )}
        </div>

        <Button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚀 BUTTON CLICKED: Planlegg rute!');
            onPlanRoute();
          }}
          disabled={isPlanning}
          className="w-full bg-gradient-electric hover:bg-gradient-eco shadow-neon hover:shadow-glow animate-pulse-neon disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {isPlanning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
              Planlegger rute...
            </>
          ) : (
            <>
              <Route className="h-4 w-4 mr-2" />
              Planlegg rute
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}