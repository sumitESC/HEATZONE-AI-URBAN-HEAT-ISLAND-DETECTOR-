import { useState, useEffect, useRef } from "react";
import { useGetCities } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Sun, Cloud, CloudRain, CloudDrizzle, CloudSnow, Wind, Droplets,
  Thermometer, ArrowLeft, Loader2, CalendarDays, MapPin, ChevronDown, Check, Globe
} from "lucide-react";
import { Link } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend
} from "recharts";

interface ForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  tempAvg: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  cloudCover: number;
  rainfall: number;
  weatherMain: string;
  weatherDescription: string;
  weatherIcon: string;
}

interface CityForecast {
  cityId: number;
  cityName: string;
  latitude: number;
  longitude: number;
  forecast: ForecastDay[];
}

function getWeatherIcon(main: string) {
  switch (main.toLowerCase()) {
    case "clear": return Sun;
    case "clouds": return Cloud;
    case "rain": return CloudRain;
    case "drizzle": return CloudDrizzle;
    case "snow": return CloudSnow;
    default: return Cloud;
  }
}

function getWeatherGradient(main: string) {
  switch (main.toLowerCase()) {
    case "clear": return "from-amber-500/20 to-orange-500/10";
    case "clouds": return "from-slate-400/20 to-gray-500/10";
    case "rain": return "from-blue-500/20 to-cyan-500/10";
    case "drizzle": return "from-blue-400/15 to-slate-500/10";
    case "haze": return "from-yellow-500/15 to-amber-500/10";
    default: return "from-gray-500/15 to-slate-500/10";
  }
}

function getTempColor(temp: number) {
  if (temp >= 40) return "#ef4444";
  if (temp >= 35) return "#f97316";
  if (temp >= 30) return "#eab308";
  if (temp >= 25) return "#22c55e";
  return "#3b82f6";
}

export default function Forecast() {
  const { data: cities, isLoading: citiesLoading } = useGetCities();
  const [selectedCityId, setSelectedCityId] = useState<number | "all">("all");
  const [forecastData, setForecastData] = useState<CityForecast | null>(null);
  const [allForecasts, setAllForecasts] = useState<CityForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        if (selectedCityId === "all") {
          const r = await fetch("/api/forecast/all/compare");
          if (!r.ok) throw new Error(`API error: ${r.status}`);
          const data: CityForecast[] = await r.json();
          setAllForecasts(data);
          setForecastData(null);
        } else {
          const r = await fetch(`/api/forecast/${selectedCityId}`);
          if (!r.ok) throw new Error(`API error: ${r.status}`);
          const data: CityForecast = await r.json();
          setForecastData(data);
          setAllForecasts([]);
        }
      } catch (err: any) {
        console.error("Forecast fetch error:", err);
        setError(err.message || "Failed to load forecast data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCityId]);

  return (
    <div className="space-y-6 pb-12">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-card border border-border/50 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-visible z-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none rounded-3xl" />
        <div className="relative z-30 w-full">
          <div className="flex items-center gap-3 mb-3">
            <CalendarDays className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white">5-Day Forecast</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base mb-6">
            Weather forecast analysis powered by OpenWeather API for all monitored Uttar Pradesh cities.
          </p>

          <div className="relative max-w-[280px]" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between bg-card hover:bg-secondary/60 border ${isDropdownOpen ? 'border-primary ring-1 ring-primary/30' : 'border-border/50'} text-foreground text-sm rounded-xl p-3 px-4 transition-all duration-200 shadow-sm cursor-pointer`}
            >
              <div className="flex items-center gap-2 truncate">
                {selectedCityId === "all" ? (
                  <><Globe className="w-4 h-4 text-blue-400" /> <span className="truncate font-medium">All Cities — Compare</span></>
                ) : (
                  <><MapPin className="w-4 h-4 text-red-400" /> <span className="truncate font-medium">{Array.isArray(cities) ? cities.find(c => c.id === selectedCityId)?.name : "Select City"}</span></>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
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
                      onClick={() => { setSelectedCityId("all"); setIsDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-secondary/60 transition-colors ${selectedCityId === "all" ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Globe className={`w-4 h-4 ${selectedCityId === "all" ? 'text-primary' : 'text-muted-foreground'}`} />
                        All Cities — Compare
                      </div>
                      {selectedCityId === "all" && <Check className="w-4 h-4" />}
                    </button>
                    
                    <div className="h-px bg-border/40 my-2 mx-4" />
                    
                    {Array.isArray(cities) && cities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => { setSelectedCityId(city.id); setIsDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left hover:bg-secondary/60 transition-colors outline-none focus-visible:bg-secondary/60 ${selectedCityId === city.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className={`w-4 h-4 ${selectedCityId === city.id ? 'text-primary' : 'text-muted-foreground/60'}`} />
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

      {(loading || citiesLoading) && (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-muted-foreground">Fetching forecast data... This may take a moment.</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <p className="text-red-400 font-semibold mb-2">Failed to load forecast</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={() => setSelectedCityId(selectedCityId)} className="mt-3 px-4 py-2 bg-secondary rounded-lg text-sm hover:bg-secondary/80 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Single city forecast */}
      {!loading && !error && forecastData && (
        <SingleCityForecast data={forecastData} />
      )}

      {/* All cities comparison */}
      {!loading && !error && allForecasts.length > 0 && (
        <AllCitiesComparison data={allForecasts} />
      )}
    </div>
  );
}

function SingleCityForecast({ data }: { data: CityForecast }) {
  const { forecast, cityName } = data;

  const chartData = forecast.map(d => ({
    day: format(parseISO(d.date), "EEE"),
    date: format(parseISO(d.date), "MMM dd"),
    max: d.tempMax,
    min: d.tempMin,
    avg: d.tempAvg,
    humidity: d.humidity,
    wind: d.windSpeed,
    rain: d.rainfall,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* 5 Day Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {forecast.map((day, i) => {
          const Icon = getWeatherIcon(day.weatherMain);
          const gradient = getWeatherGradient(day.weatherMain);
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-card border border-border/50 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-primary/30 transition-all`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} pointer-events-none`} />
              <div className="relative z-10">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  {format(parseISO(day.date), "EEEE")}
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {format(parseISO(day.date), "MMM dd, yyyy")}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-10 h-10 text-foreground/70 group-hover:scale-110 transition-transform" />
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: getTempColor(day.tempMax) }}>
                      {day.tempMax}°
                    </p>
                    <p className="text-sm text-muted-foreground">{day.tempMin}°</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground capitalize mb-3">{day.weatherDescription}</p>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground"><Droplets className="w-3 h-3" /> Humidity</span>
                    <span className="font-semibold">{day.humidity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1 text-muted-foreground"><Wind className="w-3 h-3" /> Wind</span>
                    <span className="font-semibold">{day.windSpeed} m/s</span>
                  </div>
                  {day.rainfall > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1 text-muted-foreground"><CloudRain className="w-3 h-3" /> Rain</span>
                      <span className="font-semibold">{day.rainfall} mm</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Temperature Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
        >
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-primary" /> Temperature Trend — {cityName}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Min, Avg, and Max temperatures over 5 days</p>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} unit="°" />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Area type="monotone" dataKey="max" name="Max °C" stroke="#ef4444" strokeWidth={2} fill="url(#colorMax)" />
                <Area type="monotone" dataKey="avg" name="Avg °C" stroke="#eab308" strokeWidth={2} fillOpacity={0} />
                <Area type="monotone" dataKey="min" name="Min °C" stroke="#3b82f6" strokeWidth={2} fill="url(#colorMin)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
        >
          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-400" /> Humidity & Rainfall — {cityName}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Daily average humidity and expected rainfall</p>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="humidity" name="Humidity (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="rain" name="Rainfall (mm)" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AllCitiesComparison({ data }: { data: CityForecast[] }) {
  // Build comparison chart: each city's avg temp for each day
  const allDates = data[0]?.forecast.map(f => f.date) || [];

  const dayComparison = allDates.map((date, dayIdx) => {
    const entry: Record<string, any> = {
      day: format(parseISO(date), "EEE, MMM dd"),
    };
    for (const city of data) {
      const dayData = city.forecast[dayIdx];
      if (dayData) {
        entry[city.cityName] = dayData.tempMax;
      }
    }
    return entry;
  });

  // Hottest/Coolest per day
  const extremes = allDates.map((date, dayIdx) => {
    let hottest = { city: "", temp: -Infinity };
    let coolest = { city: "", temp: Infinity };

    for (const city of data) {
      const d = city.forecast[dayIdx];
      if (d && d.tempMax > hottest.temp) hottest = { city: city.cityName, temp: d.tempMax };
      if (d && d.tempMin < coolest.temp) coolest = { city: city.cityName, temp: d.tempMin };
    }

    return { date, hottest, coolest };
  });

  // Summary: city with highest avg temp across 5 days
  const cityAvgs = data.map(c => ({
    cityName: c.cityName,
    avgMax: Math.round((c.forecast.reduce((s, f) => s + f.tempMax, 0) / c.forecast.length) * 10) / 10,
    avgHumidity: Math.round(c.forecast.reduce((s, f) => s + f.humidity, 0) / c.forecast.length),
    totalRain: Math.round(c.forecast.reduce((s, f) => s + f.rainfall, 0) * 10) / 10,
  })).sort((a, b) => b.avgMax - a.avgMax);

  const TOP_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

      {/* Daily Extremes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {extremes.map((ex, i) => (
          <motion.div
            key={ex.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card border border-border/50 rounded-2xl p-5 shadow-lg"
          >
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              {format(parseISO(ex.date), "EEEE")}
            </p>
            <p className="text-sm text-muted-foreground mb-4">{format(parseISO(ex.date), "MMM dd")}</p>

            <div className="space-y-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-red-400 font-bold mb-1">🔥 Hottest</p>
                <p className="font-bold text-foreground">{ex.hottest.city}</p>
                <p className="text-xl font-black text-red-400">{ex.hottest.temp}°C</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1">❄️ Coolest</p>
                <p className="font-bold text-foreground">{ex.coolest.city}</p>
                <p className="text-xl font-black text-blue-400">{ex.coolest.temp}°C</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* City Rankings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="font-bold text-lg mb-1">🏆 5-Day Temperature Ranking</h3>
        <p className="text-xs text-muted-foreground mb-4">Average max temperature across the forecast period</p>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cityAvgs} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} unit="°C" />
              <YAxis type="category" dataKey="cityName" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={100} />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="avgMax" name="Avg Max °C" radius={[0, 6, 6, 0]} barSize={16}>
                {cityAvgs.map((entry, idx) => (
                  <Cell key={entry.cityName} fill={getTempColor(entry.avgMax)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Top 8 city temperature trend comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
      >
        <h3 className="font-bold text-lg mb-1">📈 Temperature Trend — Top 8 Hottest Cities</h3>
        <p className="text-xs text-muted-foreground mb-4">Max temperature comparison over the next 5 days</p>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dayComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} unit="°" />
              <RechartsTooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {cityAvgs.slice(0, 8).map((city, i) => (
                <Area
                  key={city.cityName}
                  type="monotone"
                  dataKey={city.cityName}
                  stroke={TOP_COLORS[i % TOP_COLORS.length]}
                  strokeWidth={2}
                  fillOpacity={0}
                  dot={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
