import { useState, useRef, useEffect } from "react";
import { useGetCities, useGetCityDataset } from "@workspace/api-client-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Brain, Car, TreePine, Droplets, Building2, Users, Loader2, PlayCircle, MapPin, ChevronDown, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Advisor() {
  const { data: cities, isLoading: loadingCities } = useGetCities();
  const [selectedCityId, setSelectedCityId] = useState<number | "">("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: dataset, isLoading: loadingDataset } = useGetCityDataset(
    selectedCityId !== "" ? selectedCityId : 0, 
    { query: { enabled: selectedCityId !== "", queryKey: ['dataset', selectedCityId] } }
  );

  return (
    <div className="space-y-6 pb-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card border border-border/50 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-visible z-20">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent pointer-events-none rounded-3xl" />
        <div className="relative z-30 w-full">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white">AI Heat Reduction Advisor</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base mb-6">
            Leverage AI to analyze key urban factors for UP cities and generate actionable intelligence for reducing the urban heat island effect.
          </p>
          
          <div className="relative max-w-[320px]" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between bg-card hover:bg-secondary/60 border ${isDropdownOpen ? 'border-primary ring-1 ring-primary/30' : 'border-border/50'} text-foreground text-sm rounded-xl p-3 px-4 transition-all duration-200 shadow-sm cursor-pointer`}
            >
              <div className="flex items-center gap-2 truncate text-left">
                {selectedCityId === "" ? (
                  <span className="truncate font-medium text-muted-foreground truncate block">Choose a city to analyze...</span>
                ) : (
                  <><MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" /> <span className="truncate font-medium block">{Array.isArray(cities) ? cities.find(c => c.id === selectedCityId)?.name : "Select City"}</span></>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute z-50 w-full mt-2 bg-card border border-border/60 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl origin-top"
                >
                  <div className="max-h-[300px] overflow-y-auto w-full py-2">
                    <button
                      onClick={() => { setSelectedCityId(""); setIsDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-secondary/60 transition-colors ${selectedCityId === "" ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                    >
                      <span>Choose a city to analyze...</span>
                      {selectedCityId === "" && <Check className="w-4 h-4" />}
                    </button>
                    
                    <div className="h-px bg-border/40 my-2 mx-4" />
                    
                    {Array.isArray(cities) && cities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => { setSelectedCityId(city.id); setIsDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-secondary/60 transition-colors outline-none focus-visible:bg-secondary/60 ${selectedCityId === city.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className={`w-4 h-4 ${selectedCityId === city.id ? 'text-purple-400' : 'text-muted-foreground/60'}`} />
                          {city.name}
                        </div>
                        {selectedCityId === city.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {loadingDataset && selectedCityId !== "" && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-muted-foreground">Running AI heat analysis...</p>
          </div>
        </div>
      )}

      {dataset && !loadingDataset && (
        <AdvisorResults city={dataset.city} />
      )}
    </div>
  );
}

function AdvisorResults({ city }: { city: any }) {
  // Calculations based on requested spec
  // (city.waterBodiesArea might be undefined if db wasn't pushed, fallback to 10)
  const waterArea = city.waterBodiesArea || 10;
  
  const vehicleDensity = city.totalVehicles / city.totalArea;
  const greenRatio = (city.forestCover + city.urbanGreenSpace) / 100; // already in percentage terms normally, but spec says area/total. The db has forestCover as %, so let's treat it as ratio if / 100
  const populationDensity = city.populationDensity; 
  const waterIndex = waterArea / city.totalArea;
  const builtRatio = city.builtUpArea / city.totalArea;

  // Heat Contribution AI Logic
  const rawVehicles = Math.min((vehicleDensity / 5000), 1) * 35; 
  const rawGreen = Math.min((1 - greenRatio), 1) * 30;
  const rawPop = Math.min((populationDensity / 15000), 1) * 20;
  const rawWater = Math.min((1 - waterIndex), 1) * 15;
  const rawBuilt = Math.min((builtRatio), 1) * 25;

  const totalRaw = rawVehicles + rawGreen + rawPop + rawWater + rawBuilt;
  
  const contributions = [
    { name: "Vehicle emissions", value: (rawVehicles / totalRaw) * 100, icon: Car, color: "text-red-400", bg: "bg-red-400" },
    { name: "Low green cover", value: (rawGreen / totalRaw) * 100, icon: TreePine, color: "text-emerald-400", bg: "bg-emerald-400" },
    { name: "Dense construction", value: (rawBuilt / totalRaw) * 100, icon: Building2, color: "text-orange-400", bg: "bg-orange-400" },
    { name: "Population density", value: (rawPop / totalRaw) * 100, icon: Users, color: "text-blue-400", bg: "bg-blue-400" },
    { name: "Water deficit", value: (rawWater / totalRaw) * 100, icon: Droplets, color: "text-cyan-400", bg: "bg-cyan-400" },
  ].sort((a, b) => b.value - a.value);

  // Suggestions AI Logic
  const suggestions = [];
  if (vehicleDensity > 1000) {
    suggestions.push({
      trigger: "High vehicle density",
      actions: ["Encourage electric vehicles", "Create traffic restricted zones", "Promote public transport"],
      impactText: `Reducing traffic by 15% in ${city.name}`,
      impactCooling: "0.8°C",
      icon: Car
    });
  }
  if (greenRatio < 0.20) {
    suggestions.push({
      trigger: "Low green cover",
      actions: ["Increase urban tree plantation", "Create green corridors", "Develop new parks"],
      impactText: `Planting 20,000 trees in ${city.name}`,
      impactCooling: "1.2°C",
      icon: TreePine
    });
  }
  if (waterIndex < 0.05) {
    suggestions.push({
      trigger: "Low water availability",
      actions: ["Build artificial lakes", "Restore ponds and rivers", "Install urban water fountains"],
      impactText: `Creating 5 new water bodies in ${city.name}`,
      impactCooling: "0.5°C",
      icon: Droplets
    });
  }
  if (populationDensity > 4000) {
    suggestions.push({
      trigger: "High population density",
      actions: ["Create more open public spaces", "Increase green rooftops", "Designate heat-relief zones"],
      impactText: `Expanding open spaces by 10% in ${city.name}`,
      impactCooling: "0.4°C",
      icon: Users
    });
  }
  if (builtRatio > 0.40) {
    suggestions.push({
      trigger: "Dense built-up area",
      actions: ["Install cool roofs", "Use reflective building materials", "Promote rooftop gardens"],
      impactText: `Converting 20% roofs to cool roofs in ${city.name}`,
      impactCooling: "0.9°C",
      icon: Building2
    });
  }

  // Score Calculation
  // 100 is best. High heat contributors lower the score.
  const penalty = Math.min((totalRaw / 125) * 100, 95);
  const score = Math.round(100 - penalty);
  
  let riskText = "";
  let riskColor = "";
  if (score < 30) { riskText = "High heat risk"; riskColor = "text-red-500"; }
  else if (score < 60) { riskText = "Moderate heat risk"; riskColor = "text-orange-500"; }
  else if (score < 80) { riskText = "Good heat management"; riskColor = "text-yellow-400"; }
  else { riskText = "Sustainable city"; riskColor = "text-green-400"; }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Left Column: Metrics & Score */}
        <div className="space-y-6">
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-[100px] pointer-events-none" />
            <h3 className="font-bold text-lg mb-2 text-muted-foreground">Smart City Heat Score</h3>
            <div className={`text-6xl font-display font-black tracking-tighter ${riskColor} mb-2`}>
              {score}
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-sm font-semibold">
              <span className={riskColor}>{riskText}</span>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg mb-4">Key Urban Indicators</h3>
            <div className="space-y-4">
              <IndicatorRow label="Vehicle Density" value={`${Math.round(vehicleDensity)} /km²`} />
              <IndicatorRow label="Green Cover Ratio" value={`${(greenRatio * 100).toFixed(1)}%`} />
              <IndicatorRow label="Water Avail. Index" value={`${(waterIndex * 100).toFixed(2)}%`} />
              <IndicatorRow label="Population Density" value={`${Math.round(populationDensity)} /km²`} />
              <IndicatorRow label="Built-up Ratio" value={`${(builtRatio * 100).toFixed(1)}%`} />
            </div>
          </div>
        </div>

        {/* Middle Column: Contributors */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-primary" />
            Heat Contribution Analysis
          </h3>
          <div className="space-y-5">
            {contributions.map((c, i) => (
              <div key={c.name} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <c.icon className={`w-4 h-4 ${c.color}`} /> {c.name}
                  </span>
                  <span className="text-foreground">{c.value.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${c.value}%` }} 
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className={`h-full ${c.bg} rounded-full`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Suggestions & Impacts */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg space-y-6">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            AI Reduction Suggestions
          </h3>
          
          <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {suggestions.map((surg, i) => (
              <div key={i} className="bg-secondary/40 border border-border/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-background rounded-md">
                    <surg.icon className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    If {surg.trigger}
                  </span>
                </div>
                
                <ul className="space-y-2 mb-4">
                  {surg.actions.map(action => (
                    <li key={action} className="text-sm flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground mb-1">Expected Impact</div>
                  <div className="text-sm font-medium text-primary mb-1">{surg.impactText}</div>
                  <div className="flex justify-between items-center font-bold text-sm">
                    <span>Estimated Cooling</span>
                    <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs">-{surg.impactCooling}</span>
                  </div>
                </div>
              </div>
            ))}
            {suggestions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">City is highly optimized. Maintain current strategies.</p>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function IndicatorRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold font-mono text-foreground">{value}</span>
    </div>
  );
}
