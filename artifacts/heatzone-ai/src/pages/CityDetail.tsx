import { useRoute } from "wouter";
import { useGetCityDataset } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  ArrowLeft, Thermometer, Droplets, Wind, CloudRain, Car, TreePine, 
  Building2, Users, Loader2, AlertCircle, TrendingUp, MapPin, Brain, Construction, Droplet, Zap, Satellite
} from "lucide-react";
import { Link } from "wouter";
import { HeatZoneBadge } from "@/components/HeatZoneBadge";
import { cn, getPriorityColor } from "@/lib/utils";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { 
  Building, 
  Factory, 
  ShieldCheck, 
  ShieldAlert, 
  Layout, 
  Layers
} from "lucide-react";

export default function CityDetail() {
  const [match, params] = useRoute("/city/:cityId");
  const cityId = params?.cityId ? parseInt(params.cityId, 10) : 0;
  
  const { data, isLoading, error } = useGetCityDataset(cityId, {
    query: { enabled: !!cityId, queryKey: ['cityDataset', cityId] }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground">Compiling urban profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20 max-w-lg mx-auto mt-20">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
        <p>Could not retrieve data for this city. It might not exist in the database.</p>
        <Link href="/" className="inline-block mt-4 text-white bg-secondary px-4 py-2 rounded-lg hover:bg-secondary/80">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { city, latestWeather, latestPrediction, recommendations, heatHistory } = data;
  
  // Format data for Radar chart
  const radarData = [
    { subject: 'Emissions', A: Math.min(100, (latestPrediction?.emissionIndex || 0) * 10), fullMark: 100 },
    { subject: 'Concrete', A: (latestPrediction?.ndbi || 0) * 200, fullMark: 100 },
    { subject: '3D Density', A: (latestPrediction?.urbanCanyonIndex || 0) * 100, fullMark: 100 },
    { subject: 'Industrial', A: (latestPrediction?.industrialHeatFactor || 0) * 100, fullMark: 100 },
    { subject: 'Temperature', A: Math.min(100, (latestPrediction?.temperature || 0) * 2), fullMark: 100 },
    { subject: 'Veg Depletion', A: 100 - ((latestPrediction?.ndvi || 0) * 200), fullMark: 100 },
  ];

  // Format data for Area chart
  const historyData = heatHistory.slice(0, 10).reverse().map(h => ({
    time: format(new Date(h.predictedAt), 'HH:mm'),
    temp: h.temperature,
    risk: h.heatRiskScore
  }));

  return (
    <div className="space-y-6 pb-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card border border-border/50 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-3">{city.name}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <HeatZoneBadge zone={latestPrediction?.heatZone || 'unknown'} className="text-sm px-4 py-1.5" />
            <span className="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="w-4 h-4" /> {city.name}, UP
            </span>
            {latestPrediction?.confidenceScore && (
               <div className={cn(
                 "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border",
                 latestPrediction.confidenceScore > 0.8 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
               )}>
                 {latestPrediction.confidenceScore > 0.8 ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                 DATA CONFIDENCE: {(latestPrediction.confidenceScore * 100).toFixed(0)}%
               </div>
            )}
          </div>
        </div>

        <div className="relative z-10 flex flex-col md:items-end mt-4 md:mt-0">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-1">Overall Heat Risk</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-display font-black tracking-tighter" style={{ color: `var(--color-heat-${latestPrediction?.heatZone || 'moderate'})`}}>
              {latestPrediction?.heatRiskScore.toFixed(0)}
            </span>
            <span className="text-xl text-muted-foreground font-bold">/100</span>
          </div>
        </div>
      </div>
      
      {/* ML Engine Insight Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="bg-primary/5 border border-primary/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6"
      >
        <div className="bg-primary/10 p-4 rounded-full">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2 mb-1">
            Causal Intelligence Engine
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-md font-mono">Ensemble v2.0 (XAI)</span>
          </h2>
          <p className="text-muted-foreground text-sm italic font-medium leading-relaxed">
            "{latestPrediction?.riskExplanation || `Analysis complete. Primary heat risk detected due to ${latestPrediction?.primaryRiskDriver || 'urban factors'}.`}"
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Primary Risk Driver</span>
          <div className="bg-secondary/50 border border-border px-4 py-2 rounded-xl text-sm font-bold text-white shadow-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            {latestPrediction?.primaryRiskDriver || "Morphology"}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weather & Environment Column */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Thermometer className="w-5 h-5 text-primary" /> Current Weather</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/30 p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Temperature</p>
                <p className="text-2xl font-bold text-foreground">{latestWeather?.temperature.toFixed(1)}°C</p>
              </div>
              <div className="bg-secondary/30 p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1">Feels Like</p>
                <p className="text-2xl font-bold text-foreground">{latestWeather?.feelsLike.toFixed(1)}°C</p>
              </div>
              <div className="bg-secondary/30 p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Droplets className="w-3 h-3"/> Humidity</p>
                <p className="text-lg font-bold text-foreground">{latestWeather?.humidity}%</p>
              </div>
              <div className="bg-secondary/30 p-3 rounded-xl">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Wind className="w-3 h-3"/> Wind</p>
                <p className="text-lg font-bold text-foreground">{latestWeather?.windSpeed} m/s</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Satellite className="w-5 h-5 text-blue-400" /> Satellite Diagnostic</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-bold uppercase tracking-wider">
                  <span className="text-muted-foreground flex items-center gap-1"><Construction className="w-4 h-4 text-orange-400"/> NDBI (Concrete)</span>
                  <span className="text-foreground">{latestPrediction?.ndbi?.toFixed(3)}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(latestPrediction?.ndbi || 0.1) * 300}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/40 p-3 rounded-xl border border-white/5">
                   <div className="flex items-center gap-2 mb-1">
                     <Building className="w-3.5 h-3.5 text-blue-400" />
                     <span className="text-[10px] uppercase font-bold text-muted-foreground">Urban Canyon</span>
                   </div>
                   <p className="text-lg font-bold">{(latestPrediction?.urbanCanyonIndex || 0.42).toFixed(2)}</p>
                </div>
                <div className="bg-secondary/40 p-3 rounded-xl border border-white/5">
                   <div className="flex items-center gap-2 mb-1">
                     <Factory className="w-3.5 h-3.5 text-purple-400" />
                     <span className="text-[10px] uppercase font-bold text-muted-foreground">Industrial Factor</span>
                   </div>
                   <p className="text-lg font-bold">{(latestPrediction?.industrialHeatFactor || 0.15).toFixed(2)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-border/50 flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                <span className="text-muted-foreground flex items-center gap-1"><Building2 className="w-4 h-4 text-indigo-400"/> Avg. Height</span>
                <span className="text-foreground">{latestPrediction?.avgBuildingHeight?.toFixed(1)}m</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Heat Risk Trend (Last 24h)</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg flex flex-col"
            >
              <h3 className="font-bold text-lg mb-2">Heat Factor Analysis</h3>
              <p className="text-xs text-muted-foreground mb-4">Multi-variate contributors to the heat island effect.</p>
              <div className="h-[220px] w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Radar name="City Profile" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col gap-3"
            >
              <h3 className="font-bold text-lg text-white mb-1">AI Interventions</h3>
              {recommendations.slice(0, 3).map((rec, i) => (
                <div key={rec.id} className="bg-secondary/40 border border-border/50 rounded-xl p-4 hover:bg-secondary transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm text-foreground pr-2">{rec.title}</h4>
                    <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border", getPriorityColor(rec.priority))}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{rec.description}</p>
                </div>
              ))}
              {recommendations.length === 0 && (
                <div className="text-sm text-muted-foreground p-4 bg-secondary/20 rounded-xl border border-dashed border-border text-center">
                  No active recommendations at this time.
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
