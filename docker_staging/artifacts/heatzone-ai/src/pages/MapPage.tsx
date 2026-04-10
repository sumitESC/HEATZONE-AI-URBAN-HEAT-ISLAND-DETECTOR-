import { useState, useMemo } from "react";
import { useGetAllHeatPredictions } from "@workspace/api-client-react";
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from "react-leaflet";
import { Link } from "wouter";
import { HeatZoneBadge } from "@/components/HeatZoneBadge";
import { getHeatZoneHex } from "@/lib/utils";
import { AlertCircle, Loader2, ArrowRight, Satellite, Map as MapIcon, ArrowUpDown, ExternalLink, Thermometer, Droplets, TreePine } from "lucide-react";
import { motion } from "framer-motion";

const TILE_LAYERS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a> — Earthstar Geographics',
  },
};
// NASA GIBS date for near-real-time data (use yesterday for data availability)
const gibsDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
})();

const OVERLAYS = {
  none: null,
  temperature: {
    // MODIS Land Surface Temperature (Day) — real satellite data from NASA Terra
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/${gibsDate}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`,
    attribution: '&copy; <a href="https://earthdata.nasa.gov">NASA EOSDIS GIBS</a> — MODIS Terra LST',
  },
  satellite: {
    // MODIS True Color corrected reflectance — real satellite imagery from NASA
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    attribution: '&copy; <a href="https://earthdata.nasa.gov">NASA EOSDIS GIBS</a> — MODIS Terra',
  },
  clouds: {
    // VIIRS Cloud Cover from Suomi NPP satellite
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${gibsDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
    attribution: '&copy; <a href="https://earthdata.nasa.gov">NASA EOSDIS GIBS</a> — VIIRS SNPP',
  },
};

export default function MapPage() {
  const { data: cities, isLoading, error } = useGetAllHeatPredictions();
  const [tileMode, setTileMode] = useState<"dark" | "satellite">("dark");
  const [overlayMode, setOverlayMode] = useState<"none" | "temperature" | "satellite" | "clouds">("none");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !cities) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20 max-w-lg mx-auto mt-20">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Failed to load map data</h2>
        <p>Could not fetch heat zone predictions. Please check your connection or try syncing data.</p>
      </div>
    );
  }

  // Centered on Uttar Pradesh
  const center: [number, number] = [26.8467, 80.9462];
  const tile = TILE_LAYERS[tileMode];
  const overlay = OVERLAYS[overlayMode];

  return (
    <div className="space-y-6">
      <div className="shrink-0">
        <h1 className="text-3xl font-display font-bold text-white mb-2">Geospatial Analysis</h1>
        <p className="text-muted-foreground">Interactive map of Uttar Pradesh urban heat islands.</p>
      </div>

      <motion.div
        // @ts-ignore -- layout prop
        layout 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/20 relative z-0 h-[60vh] min-h-[400px]"
      >
        <MapContainer 
          center={center} 
          zoom={7} 
          style={{ height: '100%', width: '100%', background: 'hsl(var(--background))' }}
          zoomControl={false}
        >
          <TileLayer
            key={tileMode}
            attribution={tile.attribution}
            url={tile.url}
          />
          {overlay && (
            <TileLayer
              key={overlayMode}
              attribution={overlay.attribution}
              url={overlay.url}
              opacity={0.65}
            />
          )}
          <ZoomControl position="bottomright" />

          {cities.map((city) => {
            const color = getHeatZoneHex(city.heatZone);
            return (
              <CircleMarker
                key={city.cityId}
                center={[city.latitude, city.longitude]}
                radius={city.heatRiskScore / 3} // Dynamic radius based on risk
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.4,
                  weight: 2,
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-display font-bold text-lg text-foreground m-0 leading-none">{city.cityName}</h3>
                      <HeatZoneBadge zone={city.heatZone} showIcon={false} />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center text-sm border-b border-border/50 pb-1">
                        <span className="text-muted-foreground">Risk Score</span>
                        <span className="font-mono font-bold" style={{ color }}>{city.heatRiskScore.toFixed(1)}/100</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b border-border/50 pb-1">
                        <span className="text-muted-foreground">Temperature</span>
                        <span className="font-semibold">{city.temperature.toFixed(1)} °C</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Green Cover</span>
                        <span className="font-semibold">{city.greenCoverRatio.toFixed(1)}%</span>
                      </div>
                    </div>

                    <Link 
                      href={`/city/${city.cityId}`}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      View Full Analysis <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
        
        {/* Satellite / Dark toggle & Overlays */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
          <button
            onClick={() => setTileMode(tileMode === "dark" ? "satellite" : "dark")}
            className="flex items-center gap-2 bg-card/90 backdrop-blur-md border border-border px-3 py-2 rounded-xl shadow-xl text-sm font-semibold text-foreground hover:bg-card transition-colors w-fit"
          >
            {tileMode === "dark" ? (
              <><Satellite className="w-4 h-4 text-blue-400" /> Satellite</>
            ) : (
              <><MapIcon className="w-4 h-4 text-purple-400" /> Dark Map</>
            )}
          </button>
          
          <div className="flex flex-wrap bg-card/90 backdrop-blur-md border border-border rounded-xl shadow-xl overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setOverlayMode("none")}
              className={`px-2.5 py-2 transition-colors ${overlayMode === "none" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
            >
              Cities Only
            </button>
            <div className="w-px bg-border"></div>
            <button
              onClick={() => setOverlayMode("temperature")}
              className={`px-2.5 py-2 transition-colors flex items-center gap-1 ${overlayMode === "temperature" ? "bg-orange-500 text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
            >
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> 🌡 LST
            </button>
            <div className="w-px bg-border"></div>
            <button
              onClick={() => setOverlayMode("satellite")}
              className={`px-2.5 py-2 transition-colors flex items-center gap-1 ${overlayMode === "satellite" ? "bg-emerald-500 text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 🛰 MODIS
            </button>
            <div className="w-px bg-border"></div>
            <button
              onClick={() => setOverlayMode("clouds")}
              className={`px-2.5 py-2 transition-colors flex items-center gap-1 ${overlayMode === "clouds" ? "bg-blue-400 text-white" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> ☁ VIIRS
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground/60 px-1">NASA GIBS Data: {gibsDate}</span>
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 z-[400] bg-card/90 backdrop-blur-md border border-border p-4 rounded-xl shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Heat Zones</h4>
          <div className="space-y-2">
            {[
              { label: 'Extreme (>45)', color: 'bg-red-500' },
              { label: 'High (36-45)', color: 'bg-orange-500' },
              { label: 'Moderate (26-35)', color: 'bg-lime-400' },
              { label: 'Cool (<26)', color: 'bg-green-700' }
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-foreground">
                <span className={`w-3 h-3 rounded-full ${item.color} shadow-[0_0_8px_currentColor]`}></span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Satellite Analysis Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-card border border-border/50 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <Satellite className="w-5 h-5 text-blue-400" />
              Satellite Analysis — City Heat Data
            </h2>
            <p className="text-xs text-muted-foreground mt-1">Cross-reference with NASA GIBS satellite layers above for visual validation. Data: {gibsDate}</p>
          </div>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">{cities.length} Cities</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/50 bg-secondary/30">
                <th className="text-left px-4 py-3 font-semibold">#</th>
                <th className="text-left px-4 py-3 font-semibold">City</th>
                <th className="text-left px-4 py-3 font-semibold">Zone</th>
                <th className="text-center px-4 py-3 font-semibold"><span className="inline-flex items-center gap-1"><Thermometer className="w-3 h-3" /> Temp</span></th>
                <th className="text-center px-4 py-3 font-semibold"><span className="inline-flex items-center gap-1"><Droplets className="w-3 h-3" /> Humidity</span></th>
                <th className="text-center px-4 py-3 font-semibold">Risk Score</th>
                <th className="text-center px-4 py-3 font-semibold"><span className="inline-flex items-center gap-1"><TreePine className="w-3 h-3" /> Green</span></th>
                <th className="text-left px-4 py-3 font-semibold">Satellite Insight</th>
                <th className="text-center px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {[...cities]
                .sort((a, b) => b.heatRiskScore - a.heatRiskScore)
                .map((city, i) => {
                  const color = getHeatZoneHex(city.heatZone);
                  const riskPct = Math.min(city.heatRiskScore, 100);
                  // Generate a satellite insight based on data
                  const insight = city.heatZone === 'extreme'
                    ? 'LST likely shows intense thermal signature. Verify with 🌡 overlay.'
                    : city.heatZone === 'high'
                    ? 'Elevated surface temp expected. Check MODIS for built-up density.'
                    : city.greenCoverRatio > 30
                    ? 'Good green cover. MODIS should show vegetation around city.'
                    : 'Moderate heat. Verify urban spread with 🛰 MODIS layer.';

                  return (
                    <tr
                      key={city.cityId}
                      className="border-b border-border/30 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{city.cityName}</td>
                      <td className="px-4 py-3"><HeatZoneBadge zone={city.heatZone} showIcon={false} /></td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono font-bold" style={{ color }}>{city.temperature.toFixed(1)}°C</span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{city.humidity.toFixed(0)}%</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${riskPct}%`, backgroundColor: color }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold" style={{ color }}>{city.heatRiskScore.toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-semibold ${city.greenCoverRatio > 25 ? 'text-green-400' : 'text-orange-400'}`}>
                          {city.greenCoverRatio.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">{insight}</td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/city/${city.cityId}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-semibold transition-colors"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-border/50 bg-secondary/20 text-[11px] text-muted-foreground/60 text-center">
          💡 Toggle <strong>🌡 LST</strong> on the map above to visually validate surface temperatures against this data. Use <strong>🛰 MODIS</strong> to check green cover and urban density.
        </div>
      </motion.div>
    </div>
  );
}
