import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send, Mic, Bot, User, Loader2, StopCircle, Volume2, VolumeX,
  MapPin, BarChart3, Sparkles, Globe, PieChart, FileText, AlertTriangle,
  ShieldCheck, Download, Sliders, Activity, Users, PlayCircle,
  CloudSun, CloudRain, Sun, Wind, Droplets, Thermometer, CloudLightning
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, RadialLinearScale, Filler, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Line, Pie, Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  RadialLinearScale, Filler, Title, Tooltip, Legend, ArcElement
);

// IMPORTANT: Do not hardcode API keys in source code. Use environment variables or .env files.
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "";
const API_BASE_URL = "/api";

interface ChatMessage { id?: string; role: "user" | "assistant" | "system"; content: string; }

interface SynthesizedHeatData {
  cityName: string; latitude: number; longitude: number; temperature: number;
  feelsLike: number; humidity: number; windSpeed: number; condition: string;
  heatRiskScore: number; heatZone: "cool" | "moderate" | "high" | "extreme"; recommendation: string;
}

// ENHANCED FORECAST DATA TYPE
interface DailyForecast {
  day: string; tempMax: number; tempMin: number; condition: string;
  humidity: number; windSpeed: number; rain: number;
}

function calculateHeatRiskScore(temp: number, humidity: number): number {
  let score = ((temp - 20) / 30) * 100;
  if (humidity > 50) score += (humidity - 50) * 0.4;
  if (temp > 35) score += (temp - 35) * 2;
  return Math.min(Math.max(Math.round(score * 10) / 10, 0), 100);
}

function determineHeatZone(score: number): "cool" | "moderate" | "high" | "extreme" {
  if (score < 40) return "cool"; if (score < 65) return "moderate";
  if (score < 85) return "high"; return "extreme";
}

function getHeatColor(zone: string): string {
  switch (zone?.toLowerCase()) {
    case "extreme": return "#ef4444"; case "high": return "#f97316";
    case "moderate": return "#eab308"; case "cool": return "#22c55e"; default: return "#6b7280";
  }
}

function getWeatherIcon(condition: string) {
  const cond = condition.toLowerCase();
  if (cond.includes("thunder") || cond.includes("storm")) return <CloudLightning className="w-5 h-5 text-purple-400" />;
  if (cond.includes("rain") || cond.includes("drizzle")) return <CloudRain className="w-5 h-5 text-blue-400" />;
  if (cond.includes("cloud") || cond.includes("overcast")) return <CloudSun className="w-5 h-5 text-gray-300" />;
  if (cond.includes("clear") || cond.includes("sun")) return <Sun className="w-5 h-5 text-yellow-400 animate-pulse" />;
  return <Thermometer className="w-5 h-5 text-orange-400" />;
}

function formatMarkdownText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-white drop-shadow-sm">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic text-gray-300">{part.slice(1, -1)}</em>;
    return part;
  });
}

async function fetchCurrentWeather(city: string): Promise<SynthesizedHeatData> {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeather API Error: ${res.statusText}`);
  const data = await res.json();
  const score = calculateHeatRiskScore(data.main.temp, data.main.humidity);
  const zone = determineHeatZone(score);
  return {
    cityName: data.name, latitude: data.coord.lat, longitude: data.coord.lon,
    temperature: data.main.temp, feelsLike: data.main.feels_like, humidity: data.main.humidity,
    windSpeed: Math.round(data.wind.speed * 3.6 * 10) / 10, condition: data.weather[0]?.main || "Unknown",
    heatRiskScore: score, heatZone: zone, recommendation: zone === "extreme" ? "CRITICAL: Extreme heat detected." : "Normal conditions."
  };
}

// ENHANCED TO EXTRACT WIND AND RAIN
async function fetchForecastWeather(city: string): Promise<DailyForecast[]> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeather Forecast API Error: ${res.statusText}`);
  const data = await res.json();

  const dailyMap = new Map<string, { max: number; min: number; conditions: string[]; humidities: number[], maxWind: number, totalRain: number }>();

  data.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000);
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (!dailyMap.has(dayStr)) dailyMap.set(dayStr, { max: -100, min: 100, conditions: [], humidities: [], maxWind: 0, totalRain: 0 });

    const dayData = dailyMap.get(dayStr)!;
    if (item.main.temp_max > dayData.max) dayData.max = item.main.temp_max;
    if (item.main.temp_min < dayData.min) dayData.min = item.main.temp_min;

    const windKmH = item.wind?.speed ? item.wind.speed * 3.6 : 0;
    if (windKmH > dayData.maxWind) dayData.maxWind = windKmH;

    if (item.rain && item.rain['3h']) dayData.totalRain += item.rain['3h'];

    dayData.conditions.push(item.weather[0].main);
    dayData.humidities.push(item.main.humidity);
  });

  const results: DailyForecast[] = [];
  let count = 0;
  dailyMap.forEach((value, key) => {
    if (count >= 5) return;
    const condition = value.conditions.sort((a, b) => value.conditions.filter(v => v === a).length - value.conditions.filter(v => v === b).length).pop() || "Clear";
    const avgHumidity = Math.round(value.humidities.reduce((s, h) => s + h, 0) / value.humidities.length);

    results.push({
      day: key, tempMax: Math.round(value.max * 10) / 10, tempMin: Math.round(value.min * 10) / 10,
      condition, humidity: avgHumidity, windSpeed: Math.round(value.maxWind * 10) / 10, rain: Math.round(value.totalRain * 10) / 10
    });
    count++;
  });
  return results;
}

const ChatWeatherCardWidget = React.memo(function ChatWeatherCardWidget({ targetId }: { targetId: string }) {
  const [data, setData] = useState<SynthesizedHeatData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchCurrentWeather(targetId).then(res => { if (isMounted) setData(res); }).catch(() => { if (isMounted) setError(true); });
    return () => { isMounted = false; };
  }, [targetId]);

  if (error) return <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">Failed to load weather for "{targetId}".</div>;
  if (!data) return <div className="my-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl animate-pulse w-full max-w-[340px] md:max-w-md h-[220px]" />;

  const color = getHeatColor(data.heatZone);

  return (
    <div className="my-3 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl w-full max-w-[340px] md:max-w-md transition-all hover:border-white/20">
      <div className="flex justify-between items-start mb-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-xl font-black text-white tracking-wide">{data.cityName}</h3>
          <div className="flex items-center gap-2 mt-1.5 bg-white/5 px-2 py-1 rounded-lg w-fit border border-white/5">
            {getWeatherIcon(data.condition)}<span className="text-xs font-semibold text-gray-200 uppercase tracking-wider">{data.condition}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-4xl font-black text-white drop-shadow-md">{Math.round(data.temperature)}°</span>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">Feels like {Math.round(data.feelsLike)}°</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
          <div><p className="text-[10px] text-gray-400 uppercase mb-0.5">Humidity</p><p className="font-bold text-white text-sm">{data.humidity}%</p></div>
          <Droplets className="w-5 h-5 text-blue-400 opacity-80" />
        </div>
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between">
          <div><p className="text-[10px] text-gray-400 uppercase mb-0.5">Wind</p><p className="font-bold text-white text-sm">{data.windSpeed} km/h</p></div>
          <Wind className="w-5 h-5 text-teal-400 opacity-80" />
        </div>
      </div>
      <div className="bg-gradient-to-r from-black/60 to-transparent rounded-xl p-3 flex justify-between items-center border-l-4 shadow-lg" style={{ borderColor: color }}>
        <div className="flex items-center gap-2"><Activity className="w-4 h-4" style={{ color }} /><span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Heat Risk Score</span></div>
        <div className="text-right flex items-center gap-2">
          <span className="font-black text-xl" style={{ color }}>{data.heatRiskScore}</span>
          <span className="text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase" style={{ backgroundColor: color }}>{data.heatZone}</span>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// ─── NEW WIDGET: MULTI-TABBED FORECAST CHART (Line, Bar, Pie) ───────────────
// ============================================================================

const ChatForecastChartWidget = React.memo(function ChatForecastChartWidget({ targetId }: { targetId: string }) {
  const [forecast, setForecast] = useState<DailyForecast[]>([]);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'temp' | 'rainwind' | 'conditions'>('temp');

  useEffect(() => {
    let isMounted = true;
    fetchForecastWeather(targetId).then(data => { if (isMounted) setForecast(data); }).catch(() => { if (isMounted) setError(true); });
    return () => { isMounted = false; };
  }, [targetId]);

  if (error) return <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">Failed to load forecast for "{targetId}".</div>;
  if (forecast.length === 0) return <div className="my-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-full max-w-[340px] md:max-w-md h-[300px] animate-pulse" />;

  const labels = forecast.map(f => f.day.split(',')[0]);

  // Tab 1: Temp Line Chart
  const tempChartData = {
    labels,
    datasets: [
      { label: 'Max °C', data: forecast.map(f => f.tempMax), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 },
      { label: 'Min °C', data: forecast.map(f => f.tempMin), borderColor: '#3b82f6', backgroundColor: 'transparent', borderDash: [5, 5], tension: 0.4 }
    ]
  };

  // Tab 2: Rain/Wind Bar Chart
  const rainWindChartData = {
    labels,
    datasets: [
      { type: 'bar' as const, label: 'Rain (mm)', data: forecast.map(f => f.rain), backgroundColor: 'rgba(59, 130, 246, 0.8)', borderRadius: 4 },
      { type: 'line' as const, label: 'Wind (km/h)', data: forecast.map(f => f.windSpeed), borderColor: '#14b8a6', borderWidth: 2, tension: 0.3 }
    ]
  };

  // Tab 3: Conditions Pie Chart
  const conditionCounts = forecast.reduce((acc, curr) => {
    acc[curr.condition] = (acc[curr.condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = {
    labels: Object.keys(conditionCounts),
    datasets: [{
      data: Object.values(conditionCounts),
      backgroundColor: ['#fcd34d', '#9ca3af', '#60a5fa', '#f87171', '#c084fc'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#9ca3af', font: { size: 10 } } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#9ca3af' } }
    }
  };

  return (
    <div className="my-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-full max-w-[340px] md:max-w-md">
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-orange-400" /><span className="text-sm font-bold text-white uppercase">{targetId} Forecast</span></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 bg-black/40 p-1 rounded-lg">
        <button onClick={() => setActiveTab('temp')} className={cn("flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all", activeTab === 'temp' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>TEMP</button>
        <button onClick={() => setActiveTab('rainwind')} className={cn("flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all", activeTab === 'rainwind' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>RAIN & WIND</button>
        <button onClick={() => setActiveTab('conditions')} className={cn("flex-1 text-[10px] font-bold py-1.5 rounded-md transition-all", activeTab === 'conditions' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}>SUMMARY</button>
      </div>

      <div style={{ height: 180 }}>
        {activeTab === 'temp' && <Line data={tempChartData} options={chartOptions} />}
        {activeTab === 'rainwind' && <Chart type="bar" data={rainWindChartData} options={chartOptions} />}
        {activeTab === 'conditions' && <Pie data={pieChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#fff' } } } }} />}
      </div>
    </div>
  );
});

// ============================================================================
// ─── NEW WIDGET: MULTI-CITY COMPARISON CHART ────────────────────────────────
// ============================================================================

const ChatComparisonWidget = React.memo(function ChatComparisonWidget({ citiesStr }: { citiesStr: string }) {
  const [dataList, setDataList] = useState<SynthesizedHeatData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const cities = citiesStr.split(",").map(c => c.trim()).filter(Boolean);

    Promise.all(cities.map(c => fetchCurrentWeather(c).catch(() => null)))
      .then(results => {
        if (isMounted) {
          setDataList(results.filter(r => r !== null) as SynthesizedHeatData[]);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [citiesStr]);

  if (loading) return <div className="my-3 bg-white/5 border border-white/10 rounded-2xl p-4 h-[260px] animate-pulse w-full max-w-[340px] md:max-w-md" />;
  if (dataList.length === 0) return null;

  const chartData = {
    labels: dataList.map(d => d.cityName),
    datasets: [
      {
        label: 'Temperature °C',
        data: dataList.map(d => d.temperature),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Heat Risk Score',
        data: dataList.map(d => d.heatRiskScore),
        backgroundColor: 'rgba(249, 115, 22, 0.7)',
        borderRadius: 4,
      }
    ]
  };

  return (
    <div className="my-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl w-full max-w-[340px] md:max-w-md">
      <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
        <Activity className="w-4 h-4 text-pink-400" />
        <span className="text-sm font-bold text-white tracking-wider uppercase">City Comparison</span>
      </div>
      <div style={{ height: 200 }}>
        <Bar
          data={chartData}
          options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
              x: { ticks: { color: '#fff' }, grid: { display: false } },
              y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.1)' } }
            }
          }}
        />
      </div>
    </div>
  );
});

// ============================================================================
// ─── WIDGET: OPENWEATHER MAP ────────────────────────────────────────────────
// ============================================================================
const ChatMapWidget = React.memo(function ChatMapWidget({ cityId }: { cityId: string }) {
  const [data, setData] = useState<SynthesizedHeatData | null>(null);
  useEffect(() => { let isMounted = true; fetchCurrentWeather(cityId).then(res => { if (isMounted) setData(res); }).catch(() => { }); return () => { isMounted = false; }; }, [cityId]);

  if (!data) return <div className="my-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 h-[260px] animate-pulse w-full max-w-[340px] md:max-w-md" />;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl my-3 relative z-0 w-full max-w-[340px] md:max-w-md" style={{ height: 260 }}>
      <div className="absolute top-2 left-2 z-[400] bg-black/80 backdrop-blur-xl px-2.5 py-1 rounded-lg text-[10px] text-white flex items-center gap-1.5 border border-white/10 shadow-lg">
        <MapPin className="w-3.5 h-3.5 text-red-500 animate-bounce" /> {data.cityName} Heat Map
      </div>
      <MapContainer center={[data.latitude, data.longitude]} zoom={10} style={{ height: "100%", width: "100%", background: "#0f172a", zIndex: 1 }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <ZoomControl position="bottomright" />
        <CircleMarker center={[data.latitude, data.longitude]} radius={20} pathOptions={{ color: getHeatColor(data.heatZone), fillColor: getHeatColor(data.heatZone), fillOpacity: 0.5, weight: 2 }}>
          <Popup><div className="text-slate-900 p-2 min-w-[120px]"><h4 className="font-black border-b border-gray-200 pb-1 mb-1">{data.cityName}</h4><p className="text-sm">Temp: <b>{data.temperature}°C</b></p><p className="text-xs text-gray-600 mt-1">Risk: {data.heatRiskScore}</p></div></Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
});

// ============================================================================
// ─── WIDGET: NASA GIBS MAP ──────────────────────────────────────────────────
// ============================================================================
const ChatNasaMapWidget = React.memo(function ChatNasaMapWidget() {
  const targetDate = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString().split('T')[0]; }, []);
  const tileUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/${targetDate}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`;
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl my-3 relative z-0 w-full max-w-[340px] md:max-w-md" style={{ height: 260 }}>
      <MapContainer center={[20.5937, 78.9629]} zoom={4} style={{ height: "100%", width: "100%", background: "#050505", zIndex: 1 }} zoomControl={false}>
        <TileLayer url={tileUrl} maxZoom={7} /><ZoomControl position="bottomright" />
      </MapContainer>
    </div>
  );
});

// ============================================================================
// ─── MESSAGE PARSER ─────────────────────────────────────────────────────────
// ============================================================================
function parseMessageContent(content: string): React.ReactNode[] {
  const cleanContent = content.replace(/<think>[\s\S]*?(<\/think>|$)/gi, "").trim();
  const tagRegex = /(\[RENDER_[A-Z_]+[^\]]*\])/g;
  const parts = cleanContent.split(tagRegex);

  return parts.map((part, i) => {
    if (!part) return null;
    const key = `part-${i}`;

    if (part.startsWith("[RENDER_NASA_MAP")) return <ChatNasaMapWidget key={key} />;

    // NEW: Proper Comparison Handler
    if (part.startsWith("[RENDER_COMPARISON:")) {
      const arg = part.replace("[RENDER_COMPARISON:", "").replace("]", "").trim();
      return <ChatComparisonWidget key={key} citiesStr={arg} />;
    }

    if (part.startsWith("[RENDER_MAP:")) return <ChatMapWidget key={key} cityId={part.replace("[RENDER_MAP:", "").replace("]", "").trim()} />;
    if (part.startsWith("[RENDER_FORECAST:") || part.startsWith("[RENDER_CHART:")) {
      const arg = part.replace(/\[RENDER_(FORECAST|CHART):/, "").replace("]", "").split(":")[0].trim();
      return <ChatForecastChartWidget key={key} targetId={arg} />;
    }
    if (part.startsWith("[RENDER_CARD:") || part.startsWith("[RENDER_REPORT:")) {
      const arg = part.replace(/\[RENDER_(CARD|REPORT):/, "").replace("]", "").split(":").pop()?.trim() || "City";
      return <ChatWeatherCardWidget key={key} targetId={arg} />;
    }
    if (part.startsWith("[") && part.includes("RENDER")) return null;

    return <span key={key} className="whitespace-pre-wrap leading-relaxed block text-[14.5px]">{formatMarkdownText(part)}</span>;
  }).filter(Boolean);
}

// ============================================================================
// ─── MESSAGE ROW ────────────────────────────────────────────────────────────
// ============================================================================
const MessageRow = React.memo(({ msg, isStreaming }: { msg: ChatMessage, isStreaming: boolean }) => {
  const cleanContent = msg.content.replace(/<think>[\s\S]*?(<\/think>|$)/gi, "").trim();
  const isEmpty = cleanContent.length === 0;
  const contentToParse = isStreaming ? cleanContent.replace(/\[RENDER_[^\]]+\]/g, "\n*[Generating visual...]*\n") : cleanContent;
  const parsedContent = useMemo(() => parseMessageContent(contentToParse), [contentToParse]);
  const isUser = msg.role === "user";

  if (msg.role === "system") return null;
  if (isEmpty && !isStreaming) return null;

  return (
    <motion.div layout="position" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className={cn("flex gap-3 w-full", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-lg mt-1", isUser ? "bg-gradient-to-br from-orange-500 to-pink-500 border-orange-400/50 text-white" : "bg-[#1e1b4b] text-purple-400 border-purple-500/40")}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={cn("px-4 py-3 text-sm break-words shadow-lg will-change-transform w-fit max-w-[88%]", isUser ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-2xl rounded-tr-sm" : "bg-white/5 backdrop-blur-xl text-gray-200 border border-white/10 rounded-2xl rounded-tl-sm")}>
        {isEmpty && isStreaming ? (
          <div className="flex items-center gap-1.5 h-5 px-1">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        ) : (parsedContent)}
      </div>
    </motion.div>
  );
});

// ============================================================================
// ─── MAIN CHATBOT COMPONENT ─────────────────────────────────────────────────
// ============================================================================
export function Chatbot({ contextData }: { contextData: any }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTTSActive, setIsTTSActive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false; recognition.interimResults = true; recognition.lang = "en-US";
        recognition.onresult = (e: any) => setInput(Array.from(e.results).map((r: any) => r[0].transcript).join(""));
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const primeAudioEngine = () => { if (isTTSActive && window.speechSynthesis) { const prime = new SpeechSynthesisUtterance(""); prime.volume = 0; window.speechSynthesis.speak(prime); } };

  const speakResponse = useCallback((text: string) => {
    if (!isTTSActive || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/\[RENDER_[^\]]+\]/g, "").replace(/<think>[\s\S]*?(<\/think>|$)/gi, "").replace(/[*#`]/g, "").trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.volume = 1;
    const femaleVoice = window.speechSynthesis.getVoices().find(v => v.name.includes("Female") || v.name.includes("Zira"));
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  }, [isTTSActive]);

  const toggleListen = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (isListening) recognitionRef.current?.stop();
    else if (recognitionRef.current) { setInput(""); recognitionRef.current.start(); setIsListening(true); }
  }, [isListening]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, isLoading]);

  const executeAgentLoop = async (currentHistory: ChatMessage[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentHistory, context: contextData })
      });
      if (!response.ok) throw new Error("API error");

      const assistantMsgId = Date.now().toString();
      setMessages(prev => [...prev, { id: assistantMsgId, role: "assistant", content: "" }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullContent = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        fullContent += decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullContent } : m));
      }

      setIsLoading(false);
      speakResponse(fullContent);

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "⚠️ Connection error." }]);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    primeAudioEngine(); if (window.speechSynthesis) window.speechSynthesis.cancel(); if (isListening) recognitionRef.current?.stop();
    const userMsg = input.trim(); setInput("");
    const initialHistory: ChatMessage[] = [...messages, { id: Date.now().toString(), role: "user", content: userMsg }];
    setMessages(initialHistory); setIsLoading(true); await executeAgentLoop(initialHistory);
  };

  return (
    <div className="flex flex-col h-[700px] bg-[#050509] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative font-sans">
      <div className="bg-white/5 backdrop-blur-xl p-4 border-b border-white/10 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg border border-white/20"><Sparkles className="w-5 h-5 text-white" /></div>
          <div><h3 className="font-bold text-white tracking-wide">Aria Intelligence</h3><p className="text-[11px] text-purple-300 font-medium tracking-wider uppercase">Urban Climate Platform</p></div>
        </div>
        <button onClick={() => setIsTTSActive(!isTTSActive)} className={cn("p-2.5 rounded-full transition-colors border", isTTSActive ? "bg-purple-500/20 text-purple-400 border-purple-500/30" : "bg-white/5 text-gray-400 border-white/10")}>
          {isTTSActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-2xl font-bold text-white mb-2">System Online.</h2>
            <p className="text-sm text-gray-400 max-w-[350px] mb-8">Ask me about current conditions, multi-city comparisons, and forecasts.</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {["Compare weather of Varanasi and Kanpur", "Show me the 5-day forecast for Delhi"].map((q) => (
                <button key={q} onClick={() => { setInput(q); primeAudioEngine(); }} className="text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-4 py-2 rounded-full transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => <MessageRow key={msg.id || index} msg={msg} isStreaming={isLoading && index === messages.length - 1 && msg.role === 'assistant'} />)}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-white/5 backdrop-blur-xl border-t border-white/10 shrink-0 z-10">
        <form onSubmit={handleSubmit} className="flex gap-2 relative items-end max-w-4xl mx-auto">
          <div className="flex-1 bg-black/40 border border-white/10 focus-within:border-purple-500/50 rounded-2xl flex items-center p-1">
            <button type="button" onClick={toggleListen} className={cn("p-3 rounded-xl", isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-gray-400 hover:text-white")}>
              {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about weather, comparisons..." className="flex-1 bg-transparent px-2 py-3 text-sm text-white focus:outline-none" disabled={isLoading} />
          </div>
          <button type="submit" disabled={!input.trim() || isLoading} className="p-4 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl disabled:opacity-50">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}