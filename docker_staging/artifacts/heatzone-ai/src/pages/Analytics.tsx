import { useGetAllHeatPredictions, useGetCities } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line, Cell } from 'recharts';
import { motion } from "framer-motion";
import { Activity, Car, TreePine, Building2 } from "lucide-react";
import { getHeatZoneHex } from "@/lib/utils";

export default function Analytics() {
  const { data: predictions, isLoading: predLoading } = useGetAllHeatPredictions();
  const { data: cities, isLoading: citiesLoading } = useGetCities();

  if (predLoading || citiesLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!predictions || !cities || !Array.isArray(predictions) || !Array.isArray(cities)) {
    return <div className="p-8 text-center text-red-400">Failed to load analytics data. Please refresh.</div>;
  }

  // Merge datasets for charts
  const mergedData = cities.map(city => {
    const pred = predictions.find(p => p.cityId === city.id);
    return {
      name: city.name,
      heatRisk: pred?.heatRiskScore || 0,
      zone: pred?.heatZone || 'cool',
      temperature: pred?.temperature || 0,
      greenCover: city.forestCover + city.urbanGreenSpace,
      vehicles: city.totalVehicles / 1000, // in thousands
      builtUp: city.builtUpArea,
      population: city.population / 1000000 // in millions
    };
  }).sort((a, b) => b.heatRisk - a.heatRisk);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Comparative Analytics</h1>
        <p className="text-muted-foreground">Cross-city analysis of heat contributors across Uttar Pradesh.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heat vs Green Cover */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <TreePine className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-lg">Impact of Green Cover on Heat Risk</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line yAxisId="left" type="monotone" dataKey="heatRisk" name="Heat Risk Score" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="greenCover" name="Green Cover (%)" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Vehicle Emissions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <Car className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg">Vehicle Density Analysis</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mergedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'hsla(226, 30%, 16%, 0.5)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="vehicles" name="Vehicles (Thousands)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Urban Infrastructure */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-lg lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-lg">Urban Density & Heat Risk Correlation</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mergedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'hsla(226, 30%, 16%, 0.5)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="builtUp" name="Built-up Area (%)" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="heatRisk" name="Heat Risk" radius={[4, 4, 0, 0]}>
                  {mergedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getHeatZoneHex(entry.zone)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
