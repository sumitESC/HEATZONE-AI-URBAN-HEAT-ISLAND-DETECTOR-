import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Mic, Bot, User, Loader2, StopCircle, Volume2, VolumeX, MapPin, BarChart3, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from "react-leaflet";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Cell
} from "recharts";

// ΓöÇΓöÇΓöÇ Types ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// ΓöÇΓöÇΓöÇ Utility: Heat Zone Color ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function getHeatColor(zone: string): string {
  switch (zone) {
    case "extreme": return "#ef4444";
    case "high": return "#f97316";
    case "moderate": return "#a3e635";
    case "cool": return "#15803d";
    default: return "#6b7280";
  }
}

const BAR_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#f43f5e", "#14b8a6"];

// ΓöÇΓöÇΓöÇ Inline Map Widget ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ChatMapWidget({ cityId }: { cityId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const url = cityId === "all" ? "/api/heatzone/all" : `/api/heatzone/predict/${cityId}`;
        const resp = await fetch(url);
        const json = await resp.json();
        setData(cityId === "all" ? json : [json]);
      } catch { setData(null); }
      setLoading(false);
    })();
  }, [cityId]);

  if (loading) return <div className="flex items-center justify-center h-48 bg-secondary/30 rounded-xl"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>;
  if (!data || data.length === 0) return <div className="p-3 text-sm text-muted-foreground bg-secondary/30 rounded-xl">No map data available.</div>;

  const center: [number, number] = data.length === 1
    ? [data[0].latitude, data[0].longitude]
    : [26.8467, 80.9462];
  const zoom = data.length === 1 ? 10 : 7;

  return (
    <div className="rounded-xl overflow-hidden border border-border/50 shadow-lg my-2" style={{ height: 280 }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%", background: "#1a1a2e" }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
        />
        <ZoomControl position="bottomright" />
        {data.map((city: any) => {
          const color = getHeatColor(city.heatZone);
          return (
            <CircleMarker
              key={city.cityId || city.id}
              center={[city.latitude, city.longitude]}
              radius={Math.max(8, (city.heatRiskScore || 50) / 4)}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.5, weight: 2 }}
            >
              <Popup>
                <div className="p-1 min-w-[160px]">
                  <h4 className="font-bold text-sm m-0">{city.cityName}</h4>
                  <p className="text-xs m-0">≡ƒöÑ Heat Score: <b>{city.heatRiskScore?.toFixed(1)}</b>/100</p>
                  <p className="text-xs m-0">≡ƒîí Temp: <b>{city.temperature?.toFixed(1)}┬░C</b></p>
                  <p className="text-xs m-0">≡ƒÆº Humidity: <b>{city.humidity?.toFixed(0)}%</b></p>
                  <p className="text-xs m-0">≡ƒî┐ Green: <b>{city.greenCoverRatio?.toFixed(1)}%</b></p>
                  <p className="text-xs m-0 mt-1 font-semibold" style={{ color }}>Zone: {city.heatZone?.toUpperCase()}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Inline Chart Widget ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ChatChartWidget({ chartType, targetId }: { chartType: string; targetId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  useEffect(() => {
    (async () => {
      try {
        switch (chartType) {
          case "temperature_trend": {
            setTitle("≡ƒôê Temperature Trend");
            const resp = await fetch(`/api/weather/history/${targetId}?limit=15`);
            const json = await resp.json();
            setData(json.reverse().map((w: any) => ({
              time: new Date(w.recordedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
              temperature: w.temperature,
              humidity: w.humidity,
              windSpeed: w.windSpeed
            })));
            break;
          }
          case "heat_trend": {
            setTitle("≡ƒöÑ Heat Score Trend");
            const resp = await fetch(`/api/heatzone/history/${targetId}?limit=15`);
            const json = await resp.json();
            setData(json.reverse().map((p: any) => ({
              time: new Date(p.predictedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
              heatScore: p.heatRiskScore,
              temperature: p.temperature,
              humidity: p.humidity
            })));
            break;
          }
          case "forecast": {
            setTitle("≡ƒôà 5-Day Forecast");
            const resp = await fetch(`/api/forecast/${targetId}`);
            const json = await resp.json();
            setData((json.forecast || []).map((f: any) => ({
              day: f.date || f.day,
              maxTemp: f.maxTemp ?? f.temp_max,
              minTemp: f.minTemp ?? f.temp_min,
              humidity: f.humidity,
              description: f.description || f.weather
            })));
            break;
          }
          case "city_comparison": {
            setTitle("≡ƒÅÖ∩╕Å City Temperature Comparison");
            const resp = await fetch("/api/heatzone/all");
            const json = await resp.json();
            setData(json.sort((a: any, b: any) => b.heatRiskScore - a.heatRiskScore).map((c: any) => ({
              city: c.cityName,
              temperature: c.temperature,
              heatScore: c.heatRiskScore,
              humidity: c.humidity,
              greenCover: c.greenCoverRatio,
              zone: c.heatZone
            })));
            break;
          }
          case "temperature_ranking": {
            setTitle("≡ƒÅå 5-Day Temperature Ranking");
            const resp = await fetch("/api/forecast/all/compare");
            const json = await resp.json();
            // For each city, get max temp across the 5-day forecast
            const ranked = json.map((c: any) => {
              const forecasts = c.forecast || [];
              const maxTemp = forecasts.length > 0
                ? Math.max(...forecasts.map((f: any) => f.maxTemp ?? f.temp_max ?? 0))
                : 0;
              const avgTemp = forecasts.length > 0
                ? forecasts.reduce((s: number, f: any) => s + (f.maxTemp ?? f.temp_max ?? 0), 0) / forecasts.length
                : 0;
              return { city: c.cityName, maxTemp: Math.round(maxTemp * 10) / 10, avgTemp: Math.round(avgTemp * 10) / 10 };
            }).sort((a: any, b: any) => b.maxTemp - a.maxTemp);
            setData(ranked);
            break;
          }
          default:
            setData(null);
        }
      } catch { setData(null); }
      setLoading(false);
    })();
  }, [chartType, targetId]);

  if (loading) return <div className="flex items-center justify-center h-48 bg-secondary/30 rounded-xl"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>;
  if (!data || data.length === 0) return <div className="p-3 text-sm text-muted-foreground bg-secondary/30 rounded-xl">No chart data available.</div>;

  return (
    <div className="my-2 bg-secondary/20 border border-border/50 rounded-xl p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-purple-400" />
        <span className="text-sm font-bold text-foreground">{title}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        {chartType === "city_comparison" || chartType === "temperature_ranking" ? (
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="city" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {chartType === "city_comparison" ? (
              <>
                <Bar dataKey="temperature" name="Temperature (┬░C)" radius={[4, 4, 0, 0]}>
                  {data.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
                <Bar dataKey="heatScore" name="Heat Score" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.5} />
              </>
            ) : (
              <>
                <Bar dataKey="maxTemp" name="Max Temp (┬░C)" radius={[4, 4, 0, 0]}>
                  {data.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
                <Bar dataKey="avgTemp" name="Avg Temp (┬░C)" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.5} />
              </>
            )}
          </BarChart>
        ) : chartType === "forecast" ? (
          <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="maxTemp" name="Max ┬░C" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="minTemp" name="Min ┬░C" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 12, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {chartType === "temperature_trend" && (
              <>
                <Line type="monotone" dataKey="temperature" name="Temp ┬░C" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="humidity" name="Humidity %" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="windSpeed" name="Wind m/s" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </>
            )}
            {chartType === "heat_trend" && (
              <>
                <Line type="monotone" dataKey="heatScore" name="Heat Score" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="temperature" name="Temp ┬░C" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              </>
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Inline Data Card Widget ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ChatDataCardWidget({ cardType, targetId }: { cardType: string; targetId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        switch (cardType) {
          case "urban_indicators": {
            const resp = await fetch(`/api/datasets/city/${targetId}`);
            setData(await resp.json());
            break;
          }
          case "heat_score": {
            const resp = await fetch(`/api/heatzone/predict/${targetId}`);
            setData(await resp.json());
            break;
          }
          case "recommendations": {
            const resp = await fetch(`/api/recommendations/${targetId}`);
            setData(await resp.json());
            break;
          }
          case "forecast_table": {
            const resp = await fetch(`/api/forecast/${targetId}`);
            setData(await resp.json());
            break;
          }
          default:
            setData(null);
        }
      } catch { setData(null); }
      setLoading(false);
    })();
  }, [cardType, targetId]);

  if (loading) return <div className="flex items-center justify-center h-24 bg-secondary/30 rounded-xl"><Loader2 className="w-5 h-5 animate-spin text-purple-400" /></div>;
  if (!data) return <div className="p-3 text-sm text-muted-foreground bg-secondary/30 rounded-xl">No data available.</div>;

  // ΓöÇΓöÇΓöÇ Urban Indicators Card ΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (cardType === "urban_indicators" && data.city) {
    const city = data.city;
    const pred = data.latestPrediction;
    const weather = data.latestWeather;
    const indicators = [
      { label: "Population", value: city.population?.toLocaleString() || "N/A", icon: "≡ƒæÑ" },
      { label: "Area", value: `${city.area?.toLocaleString() || "N/A"} km┬▓`, icon: "≡ƒôÉ" },
      { label: "Vehicles", value: city.totalVehicles?.toLocaleString() || "N/A", icon: "≡ƒÜù" },
      { label: "Forest Cover", value: `${city.forestCover?.toFixed(1) || 0}%`, icon: "≡ƒî▓" },
      { label: "Urban Green", value: `${city.urbanGreenSpace?.toFixed(1) || 0}%`, icon: "≡ƒî┐" },
      { label: "Water Bodies", value: city.waterBodies?.toLocaleString() || "N/A", icon: "≡ƒÆº" },
      { label: "Temperature", value: weather ? `${weather.temperature?.toFixed(1)}┬░C` : "N/A", icon: "≡ƒîí" },
      { label: "Humidity", value: weather ? `${weather.humidity?.toFixed(0)}%` : "N/A", icon: "≡ƒÆª" },
    ];

    return (
      <div className="my-2 bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border border-purple-500/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-foreground">{city.name} ΓÇö Key Urban Indicators</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {indicators.map((ind) => (
            <div key={ind.label} className="flex items-center gap-2 bg-secondary/30 rounded-lg px-3 py-2">
              <span className="text-base">{ind.icon}</span>
              <div>
                <p className="text-[10px] text-muted-foreground leading-none">{ind.label}</p>
                <p className="text-xs font-bold text-foreground">{ind.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ΓöÇΓöÇΓöÇ Heat Score Card ΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (cardType === "heat_score" && data.heatRiskScore !== undefined) {
    const score = data.heatRiskScore;
    const zone = data.heatZone || "N/A";
    const color = getHeatColor(zone);
    const radarData = [
      { factor: "Temperature", value: Math.min(100, (data.temperature || 0) * 2) },
      { factor: "Humidity", value: data.humidity || 0 },
      { factor: "Vehicles", value: Math.min(100, (data.vehicleDensity || 0)) },
      { factor: "Population", value: Math.min(100, (data.populationDensity || 0)) },
      { factor: "Green Cover", value: Math.min(100, (data.greenCoverRatio || 0) * 2) },
      { factor: "Built-Up", value: Math.min(100, (data.builtUpRatio || 0)) },
    ];

    return (
      <div className="my-2 bg-gradient-to-br from-red-950/30 to-orange-950/20 border border-orange-500/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-foreground">{data.cityName} ΓÇö Smart City Heat Score</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono" style={{ color }}>{score.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{zone}</p>
          </div>
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="factor" tick={{ fill: "#94a3b8", fontSize: 9 }} />
              <PolarRadiusAxis tick={false} domain={[0, 100]} />
              <Radar name="Factors" dataKey="value" stroke={color} fill={color} fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ΓöÇΓöÇΓöÇ Recommendations Card ΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (cardType === "recommendations" && Array.isArray(data)) {
    return (
      <div className="my-2 bg-gradient-to-br from-emerald-950/30 to-teal-950/20 border border-emerald-500/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-foreground">AI Heat Reduction Recommendations</span>
        </div>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recommendations available.</p>
        ) : (
          <div className="space-y-2">
            {data.map((rec: any, i: number) => (
              <div key={i} className="flex gap-2 bg-secondary/30 rounded-lg px-3 py-2">
                <span className="font-bold text-emerald-400 text-xs mt-0.5">#{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{rec.title || rec.recommendation}</p>
                  {rec.description && <p className="text-[10px] text-muted-foreground mt-0.5">{rec.description}</p>}
                  {rec.estimatedImpact && <p className="text-[10px] text-emerald-400 mt-0.5">Impact: {rec.estimatedImpact}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ΓöÇΓöÇΓöÇ Forecast Table Card ΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (cardType === "forecast_table" && data.forecast) {
    return (
      <div className="my-2 bg-gradient-to-br from-blue-950/30 to-cyan-950/20 border border-blue-500/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-bold text-foreground">{data.cityName} ΓÇö 5-Day Forecast</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="text-left py-1.5 px-2">Day</th>
                <th className="text-center py-1.5 px-2">Max</th>
                <th className="text-center py-1.5 px-2">Min</th>
                <th className="text-center py-1.5 px-2">Humidity</th>
                <th className="text-left py-1.5 px-2">Weather</th>
              </tr>
            </thead>
            <tbody>
              {(data.forecast || []).map((f: any, i: number) => (
                <tr key={i} className="border-b border-border/20">
                  <td className="py-1.5 px-2 font-medium">{f.date || f.day}</td>
                  <td className="py-1.5 px-2 text-center font-bold text-red-400">{(f.maxTemp ?? f.temp_max)?.toFixed(1)}┬░</td>
                  <td className="py-1.5 px-2 text-center font-bold text-blue-400">{(f.minTemp ?? f.temp_min)?.toFixed(1)}┬░</td>
                  <td className="py-1.5 px-2 text-center">{f.humidity?.toFixed(0)}%</td>
                  <td className="py-1.5 px-2 text-muted-foreground">{f.description || f.weather || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return <div className="p-3 text-sm text-muted-foreground bg-secondary/30 rounded-xl">Widget could not render.</div>;
}

// ΓöÇΓöÇΓöÇ AI Report Generator Widget ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function ChatReportWidget({ cityId }: { cityId: string }) {
  const [data, setData] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [dsResp, fcResp, recResp] = await Promise.all([
          fetch(`/api/datasets/city/${cityId}`),
          fetch(`/api/forecast/${cityId}`),
          fetch(`/api/recommendations/${cityId}`)
        ]);
        setData(await dsResp.json());
        setForecast(await fcResp.json());
        const recJson = await recResp.json();
        setRecs(Array.isArray(recJson) ? recJson : []);
      } catch { setData(null); }
      setLoading(false);
    })();
  }, [cityId]);

  if (loading) return <div className="flex items-center justify-center h-48 bg-secondary/30 rounded-xl"><Loader2 className="w-6 h-6 animate-spin text-purple-400" /></div>;
  if (!data || !data.city) return <div className="p-3 text-sm text-muted-foreground bg-secondary/30 rounded-xl">Unable to generate report.</div>;

  const city = data.city;
  const pred = data.latestPrediction;
  const weather = data.latestWeather;
  const heatHistory = (data.heatHistory || []).reverse();
  const weatherHistory = (data.weatherHistory || []).reverse();
  const forecastDays = forecast?.forecast || [];
  const heatColor = pred ? getHeatColor(pred.heatZone) : "#6b7280";

  const radarData = pred ? [
    { factor: "Temperature", value: Math.min(100, (pred.temperature || 0) * 2) },
    { factor: "Humidity", value: pred.humidity || 0 },
    { factor: "Vehicles", value: Math.min(100, pred.vehicleDensity || 0) },
    { factor: "Population", value: Math.min(100, pred.populationDensity || 0) },
    { factor: "Green Cover", value: Math.min(100, (pred.greenCoverRatio || 0) * 2) },
    { factor: "Built-Up", value: Math.min(100, pred.builtUpRatio || 0) },
  ] : [];

  const indicators = [
    { label: "Population", value: city.population?.toLocaleString() || "N/A", icon: "≡ƒæÑ" },
    { label: "Area", value: `${city.area?.toLocaleString() || "N/A"} km┬▓`, icon: "≡ƒôÉ" },
    { label: "Vehicles", value: city.totalVehicles?.toLocaleString() || "N/A", icon: "≡ƒÜù" },
    { label: "Forest Cover", value: `${city.forestCover?.toFixed(1) || 0}%`, icon: "≡ƒî▓" },
    { label: "Urban Green", value: `${city.urbanGreenSpace?.toFixed(1) || 0}%`, icon: "≡ƒî┐" },
    { label: "Water Bodies", value: city.waterBodies?.toLocaleString() || "N/A", icon: "≡ƒÆº" },
  ];

  return (
    <div className="my-3 bg-gradient-to-br from-slate-950/60 to-purple-950/30 border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/10 p-4 border-b border-purple-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black text-foreground">AI Analytics Report ΓÇö {city.name}</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">Generated by Aria</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Row 1: Map + Heat Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Mini Map */}
          <div className="rounded-xl overflow-hidden border border-border/30" style={{ height: 200 }}>
            <MapContainer
              center={[city.latitude, city.longitude]}
              zoom={10}
              style={{ height: "100%", width: "100%", background: "#1a1a2e" }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              {pred && (
                <CircleMarker
                  center={[city.latitude, city.longitude]}
                  radius={Math.max(12, (pred.heatRiskScore || 50) / 3)}
                  pathOptions={{ color: heatColor, fillColor: heatColor, fillOpacity: 0.5, weight: 2 }}
                >
                  <Popup><b>{city.name}</b> ΓÇö Heat Score: {pred.heatRiskScore?.toFixed(1)}</Popup>
                </CircleMarker>
              )}
            </MapContainer>
          </div>

          {/* Heat Score Radar */}
          {pred && (
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Smart City Heat Score</span>
                <div className="text-right">
                  <span className="text-xl font-black font-mono" style={{ color: heatColor }}>{pred.heatRiskScore?.toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground">/100</span>
                  <p className="text-[9px] font-bold uppercase" style={{ color: heatColor }}>{pred.heatZone}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: "#94a3b8", fontSize: 8 }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  <Radar dataKey="value" stroke={heatColor} fill={heatColor} fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 2: Urban Indicators */}
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Key Urban Indicators</p>
          <div className="grid grid-cols-3 gap-1.5">
            {indicators.map((ind) => (
              <div key={ind.label} className="flex items-center gap-1.5 bg-secondary/30 rounded-lg px-2 py-1.5">
                <span className="text-sm">{ind.icon}</span>
                <div>
                  <p className="text-[9px] text-muted-foreground leading-none">{ind.label}</p>
                  <p className="text-[11px] font-bold text-foreground">{ind.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Temperature Trend + Forecast */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Temperature trend */}
          {weatherHistory.length > 0 && (
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/30">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">≡ƒôê Temperature Trend</p>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={weatherHistory.map((w: any) => ({
                  t: new Date(w.recordedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
                  temp: w.temperature,
                  hum: w.humidity
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 8 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 8 }} />
                  <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 8, fontSize: 10 }} />
                  <Line type="monotone" dataKey="temp" name="┬░C" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="hum" name="Humidity %" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 5-Day Forecast */}
          {forecastDays.length > 0 && (
            <div className="bg-secondary/20 rounded-xl p-3 border border-border/30">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">≡ƒôà 5-Day Forecast</p>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={forecastDays.map((f: any) => ({
                  day: f.date || f.day,
                  max: f.maxTemp ?? f.temp_max,
                  min: f.minTemp ?? f.temp_min
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 8 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 8 }} />
                  <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, fontSize: 10 }} />
                  <Bar dataKey="max" name="Max ┬░C" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="min" name="Min ┬░C" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Row 4: Heat Score Trend */}
        {heatHistory.length > 1 && (
          <div className="bg-secondary/20 rounded-xl p-3 border border-border/30">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">≡ƒöÑ Heat Score History</p>
            <ResponsiveContainer width="100%" height={110}>
              <LineChart data={heatHistory.map((h: any) => ({
                t: new Date(h.predictedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
                score: h.heatRiskScore
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 8 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 8 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#1e1b4b", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, fontSize: 10 }} />
                <Line type="monotone" dataKey="score" name="Heat Score" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: "#f97316" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Row 5: AI Recommendations */}
        {recs.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">≡ƒÆí AI Heat Reduction Recommendations</p>
            <div className="space-y-1.5">
              {recs.slice(0, 5).map((rec: any, i: number) => (
                <div key={i} className="flex gap-2 bg-emerald-950/20 border border-emerald-500/10 rounded-lg px-3 py-2">
                  <span className="font-bold text-emerald-400 text-[10px] mt-0.5">#{i + 1}</span>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">{rec.title || rec.recommendation}</p>
                    {rec.description && <p className="text-[9px] text-muted-foreground mt-0.5">{rec.description}</p>}
                    {rec.estimatedImpact && <p className="text-[9px] text-emerald-400 mt-0.5">Impact: {rec.estimatedImpact}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Report Footer */}
      <div className="px-4 py-2 border-t border-purple-500/10 bg-purple-950/20 text-center">
        <p className="text-[9px] text-muted-foreground/60">≡ƒôè Full Analytics Report ΓÇö HeatZone AI Platform ΓÇö Powered by Aria</p>
      </div>
    </div>
  );
}

// ΓöÇΓöÇΓöÇ Message Parser ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function parseMessageContent(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const result: React.ReactNode[] = [];
  let textBuffer: string[] = [];

  const flushText = () => {
    if (textBuffer.length > 0) {
      result.push(
        <span key={`text-${result.length}`} className="whitespace-pre-wrap">
          {textBuffer.join("\n")}
        </span>
      );
      textBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Match [RENDER_MAP:target]
    const mapMatch = trimmed.match(/^\[RENDER_MAP:(.+?)\]$/);
    if (mapMatch) {
      flushText();
      result.push(<ChatMapWidget key={`map-${result.length}`} cityId={mapMatch[1]} />);
      continue;
    }

    // Match [RENDER_CHART:type:target]
    const chartMatch = trimmed.match(/^\[RENDER_CHART:(.+?):(.+?)\]$/);
    if (chartMatch) {
      flushText();
      result.push(<ChatChartWidget key={`chart-${result.length}`} chartType={chartMatch[1]} targetId={chartMatch[2]} />);
      continue;
    }

    // Match [RENDER_CARD:type:target]
    const cardMatch = trimmed.match(/^\[RENDER_CARD:(.+?):(.+?)\]$/);
    if (cardMatch) {
      flushText();
      result.push(<ChatDataCardWidget key={`card-${result.length}`} cardType={cardMatch[1]} targetId={cardMatch[2]} />);
      continue;
    }

    // Match [RENDER_REPORT:target]
    const reportMatch = trimmed.match(/^\[RENDER_REPORT:(.+?)\]$/);
    if (reportMatch) {
      flushText();
      result.push(<ChatReportWidget key={`report-${result.length}`} cityId={reportMatch[1]} />);
      continue;
    }

    textBuffer.push(line);
  }

  flushText();
  return result;
}

// ΓöÇΓöÇΓöÇ Main Chatbot Component ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export function Chatbot({ contextData }: { contextData: any }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // ΓöÇΓöÇΓöÇ Stop speech utility ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // ΓöÇΓöÇΓöÇ Speech recognition setup ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as any;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join("");
          setInput(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // ΓöÇΓöÇΓöÇ TTS with female voice ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const speakResponse = useCallback((text: string) => {
    if (!isTTSActive || typeof window === "undefined" || !window.speechSynthesis) return;

    // Cancel any currently playing speech
    window.speechSynthesis.cancel();

    // Strip render tags, markdown, and emojis
    const cleanText = text
      .replace(/\[RENDER_MAP:[^\]]+\]/g, "")
      .replace(/\[RENDER_CHART:[^\]]+\]/g, "")
      .replace(/\[RENDER_CARD:[^\]]+\]/g, "")
      .replace(/[*#`]/g, "")
      .replace(/≡ƒôì|≡ƒöÑ|≡ƒî┐|ΓÜá∩╕Å|≡ƒÆí|≡ƒÜÇ|Γ¥ù|≡ƒùú∩╕Å|≡ƒÄñ|≡ƒîì|≡ƒöÆ|≡ƒôè|≡ƒÅÖ∩╕Å|≡ƒÅå|≡ƒôê|≡ƒôà|≡ƒæÑ|≡ƒôÉ|≡ƒÜù|≡ƒî▓|≡ƒÆº|≡ƒÆª|≡ƒîí|Γ£¿/g, "")
      .replace(/\n{2,}/g, ". ")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Prefer a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (v) => (v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Google UK English Female") || v.name.includes("Google US English"))
        && v.lang.startsWith("en")
    ) || voices.find(
      (v) => (v.name.toLowerCase().includes("female") || v.name.includes("Zira") || v.name.includes("Heera"))
        && v.lang.startsWith("en")
    ) || voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Microsoft"))
    );

    if (femaleVoice) utterance.voice = femaleVoice;

    window.speechSynthesis.speak(utterance);
  }, [isTTSActive]);

  // ΓöÇΓöÇΓöÇ Preload voices ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices(); // trigger load
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // ΓöÇΓöÇΓöÇ Toggle mic ΓÇö STOPS TTS when pressed ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const toggleListen = () => {
    // Always stop TTS on mic press
    stopSpeech();

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        setInput("");
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition not supported in your browser.");
      }
    }
  };

  // ΓöÇΓöÇΓöÇ Auto-scroll ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // ΓöÇΓöÇΓöÇ Submit handler ΓÇö STOPS TTS on new question ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    // Stop any speech when user sends a new message
    stopSpeech();

    const userMessage = input.trim();
    setInput("");

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage }
    ];

    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: contextData
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      const assistantMessage = data.message?.content || "I couldn't generate a response. Please try again!";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage }
      ]);

      speakResponse(assistantMessage);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I had trouble communicating with the AI Advisor. Please try again in a moment. ≡ƒÆ£" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-card border border-border/50 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/20 to-primary/10 p-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-full">
            <Bot className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Aria ΓÇö AI Climate Advisor</h3>
            <p className="text-xs text-muted-foreground">Maps ΓÇó Charts ΓÇó Analytics ΓÇó Voice</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (isTTSActive) stopSpeech();
            setIsTTSActive(!isTTSActive);
          }}
          className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          title={isTTSActive ? "Mute Voice Output" : "Enable Voice Output"}
        >
          {isTTSActive ? <Volume2 className="w-5 h-5 text-purple-400" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-70">
            <Bot className="w-12 h-12 mb-3 text-purple-400" />
            <p className="text-sm font-medium">Hello! I'm Aria, your AI Climate Advisor. ≡ƒÆ£</p>
            <p className="text-xs text-center max-w-xs mt-1">I can show you maps, graphs, forecasts, city comparisons, heat analytics, and more. Just ask!</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-sm">
              {[
                "Show me a map of all cities",
                "Compare all city temperatures",
                "Show temperature trend for Lucknow",
                "What's the heat score of Varanasi?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1.5 rounded-full hover:bg-purple-500/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={index}
              className={cn(
                "flex max-w-[90%] gap-2",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border",
                msg.role === "user" ? "bg-primary text-primary-foreground border-primary" : "bg-purple-900/40 text-purple-400 border-purple-500/30"
              )}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "px-4 py-2.5 rounded-2xl text-sm break-words overflow-hidden",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap"
                  : "bg-secondary text-secondary-foreground border border-border/50 rounded-tl-sm"
              )}>
                {msg.role === "assistant"
                  ? parseMessageContent(msg.content)
                  : msg.content
                }
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mr-auto">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-900/40 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-secondary border border-border/50 rounded-tl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-border/50">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <button
            type="button"
            onClick={toggleListen}
            className={cn(
              "flex-shrink-0 p-3 flex items-center justify-center rounded-xl transition-all duration-200 border",
              isListening
                ? "bg-red-500/20 text-red-500 border-red-500/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "bg-secondary hover:bg-secondary/80 text-muted-foreground border-border/50"
            )}
            title={isListening ? "Stop listening" : "Start Voice Input (stops current speech)"}
          >
            {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Ask Aria anything ΓÇö maps, charts, analysis..."}
              className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
