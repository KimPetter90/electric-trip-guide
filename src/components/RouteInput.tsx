import { useState } from "react";
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

// Norske byer og tettsteder for autocomplete
const norwegianCities = [
  "oslo", "bergen", "trondheim", "stavanger", "tromsø", "ålesund", 
  "kristiansand", "drammen", "fredrikstad", "lillehammer", "bodø", "molde",
  "haugesund", "tønsberg", "moss", "skien", "arendal", "hamar", "elverum",
  "kongsberg", "gjøvik", "larvik", "kristiansund", "sandnes", 
  "sarpsborg", "halden", "sandefjord", "kongsvinger", "asker", "bærum",
  "steinkjer", "levanger", "verdal", "namsos", "mo i rana", "fauske",
  "narvik", "harstad", "alta", "hammerfest", "kirkenes", "vadsø",
  "bodø", "leknes", "svolvær", "reine", "å", "flakstad", "moskenes",
  "vesterålen", "sortland", "stokmarknes", "melbu", "andenes",
  "finnsnes", "sjøvegan", "bardufoss", "målselv", "lenvik",
  "andøy", "øksnes", "bø", "hadsel", "lodge", "risøyhamn",
  "honningsvåg", "nordkapp", "lakselv", "karasjok", "kautokeino",
  "tana", "berlevåg", "båtsfjord", "vardø", "mehamn", "kjøllefjord",
  "lebesby", "gamvik", "portsanger", "nesseby", "sør-varanger",
  "porsanger", "måsøy", "nordkapp", "kvalsund", "hammerfest",
  "alta", "loppa", "hasvik", "sørkjosen", "kåfjord", "skjervøy",
  "nordreisa", "kvænangen", "lyngen", "storfjord", "gáivuotna",
  "kárášjohka", "guovdageaidnu", "deatnu", "unjárga", "davvesiida",
  "porsángu", "lebesby", "gamvik", "berlevåg", "båtsfjord",
  "røros", "oppdal", "orkdal", "melhus", "klæbu", "malvik",
  "stjørdal", "meråker", "selbu", "tydal", "os", "roan",
  "osen", "åfjord", "rissa", "leksvik", "mosvik", "inderøy",
  "snåsa", "lierne", "røyrvik", "namsskogan", "grong", "høylandet",
  "overhalla", "fosnes", "flatanger", "leka", "vikna", "nærøy",
  "bindal", "sømna", "brønnøy", "vega", "vevelstad", "herøy",
  "alstahaug", "leirfjord", "vefsn", "grane", "hattfjelldal", "dønna",
  "nesna", "hemnes", "rana", "lurøy", "træna", "rødøy", "meløy",
  "gildeskål", "beiarn", "saltdal", "fauske", "sørfold", "steigen",
  "hamarøy", "tysfjord", "lødingen", "tjeldsund", "evenes", "ballangen",
  "røst", "værøy", "flakstad", "moskenes", "vestvågøy", "vågan",
  "hadsel", "bø", "øksnes", "sortland", "andøy", "harstad",
  "kvæfjord", "skånland", "ibestad", "gratangen", "lavangen", "salangen",
  "bardu", "målselv", "sørreisa", "dyrøy", "tranøy", "torsken",
  "berg", "lenvik", "balsfjord", "karlsøy", "lyngen", "storfjord",
  "gáivuotna", "skjervøy", "nordreisa", "kvænangen", "loppa", "hasvik",
  "måsøy", "hammerfest", "sør-varanger", "vadsø", "vardø", "båtsfjord",
  "berlevåg", "tana", "nesseby", "porsanger", "karasjok", "kautokeino",
  "åmli", "åseral", "audnedal", "farsund", "flekkefjord", "hægebostad",
  "kvinesdal", "lindesnes", "lyngdal", "mandal", "marnardal", "sirdal",
  "songdalen", "søgne", "vennesla", "åsnes", "vågan", "våler",
  "eidsvoll", "gjerdrum", "hurdal", "nannestad", "nes", "oppegård",
  "ski", "sørum", "skedsmo", "rælingen", "lørenskog", "ås",
  "frogn", "vestby", "enebakk", "aurskog-høland", "rømskog", "marker",
  "spydeberg", "askim", "eidsberg", "skiptvet", "rakkestad", "råde",
  "rygge", "våler", "hobøl", "aremark", "halden", "berg", "tynset",
  "alvdal", "folldal", "os", "dovre", "lesja", "skjåk", "lom",
  "vågå", "sel", "nord-fron", "sør-fron", "ringebu", "øyer",
  "gausdal", "lillehammer", "gjøvik", "østre toten", "vestre toten",
  "jevnaker", "lunner", "gran", "søndre land", "nordre land", "sør-aurdal",
  "etnedal", "nord-aurdal", "vestre slidre", "øystre slidre", "vang",
  "hol", "ål", "gol", "hemsedal", "nes", "flå", "krødsherad",
  "modum", "øvre eiker", "nedre eiker", "lier", "røyken", "hurum",
  "flesberg", "rollag", "nore og uvdal", "sigdal", "krødsherad", "hole",
  "ringerike", "jevnaker", "eid", "hornindal", "gloppen", "stryn",
  "bremanger", "vågsøy", "selje", "eid", "hornindal", "gloppen",
  "jølster", "førde", "naustdal", "luster", "askvoll", "fjaler",
  "gaular", "balestrand", "leikanger", "sogndal", "aurland", "lærdal",
  "årdal", "vik", "høyanger", "modalen", "vaksdal", "samnanger",
  "osterøy", "meland", "øygarden", "radøy", "lindås", "austrheim",
  "fedje", "masfjorden", "gulen", "solund", "hyllestad", "høyanger",
  "vik", "balestrand", "leikanger", "sogndal", "aurland", "lærdal",
  "bykle", "valle", "bygland", "evje og hornnes", "iveland", "lillesand",
  "grimstad", "arendal", "froland", "tvedestrand", "risør", "vegårshei",
  "gjerstad", "åmli", "nissedal", "drangedal", "kragerø", "bamble",
  "porsgrunn", "skien", "siljan", "kviteseid", "nissedal", "fyresdal",
  "tokke", "vinje", "hjartdal", "seljord", "kviteseid", "vrådal",
  "tinn", "rjukan", "notodden", "sauherad", "ullensvang", "eidfjord",
  "ulvik", "granvin", "voss", "kvam", "fusa", "samnanger", "os",
  "austevoll", "sund", "fjell", "askøy", "bergen", "osterøy", "vaksdal",
  "modalen", "bømlo", "stord", "fitjar", "tysnes", "kvinnherad",
  "jondal", "odda", "ullensvang", "eidfjord", "ulvik", "granvin",
  "etne", "sauda", "suldal", "hjelmeland", "strand", "forsand",
  "sandnes", "sola", "randaberg", "stavanger", "rennesøy", "kvitsøy",
  "bokn", "tysvær", "karmøy", "haugesund", "utsira", "vindafjord",
  "ølen", "odda", "jondal", "ullensvang", "eidfjord", "ulvik",
  "granvin", "voss", "kvam", "fusa", "samnanger", "os", "austevoll",
  "sund", "fjell", "askøy", "meland", "øygarden", "radøy", "lindås",
  "austrheim", "fedje", "masfjorden", "gulen", "solund", "hyllestad"
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
}

export default function RouteInput({ routeData, onRouteChange, onPlanRoute }: RouteInputProps) {
  const handleInputChange = (field: keyof RouteData, value: string | number | Date) => {
    onRouteChange({
      ...routeData,
      [field]: value
    });
  };

  return (
    <Card className="p-6 bg-card/80 backdrop-blur-sm border-border shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Route className="h-5 w-5 text-primary animate-glow-pulse" />
        <h3 className="text-lg font-semibold text-foreground">Planlegg rute</h3>
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
              suggestions={norwegianCities}
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
              suggestions={norwegianCities}
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
              suggestions={norwegianCities}
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
            placeholder="80"
            value={routeData.batteryPercentage === 0 ? '' : routeData.batteryPercentage || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                handleInputChange('batteryPercentage', 0);
              } else {
                const numValue = parseInt(value);
                handleInputChange('batteryPercentage', isNaN(numValue) ? 0 : numValue);
              }
            }}
            className="bg-background/50 border-border focus:border-primary focus:shadow-lg"
            min="0"
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
          <Popover>
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
                onSelect={(date) => handleInputChange('travelDate', date || new Date())}
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
          onClick={onPlanRoute}
          className="w-full bg-gradient-electric hover:bg-gradient-eco shadow-neon hover:shadow-glow animate-pulse-neon"
          size="lg"
        >
          <Route className="h-4 w-4 mr-2" />
          Planlegg rute
        </Button>
      </div>
    </Card>
  );
}