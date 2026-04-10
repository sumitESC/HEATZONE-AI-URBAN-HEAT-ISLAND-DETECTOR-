import { useGetDashboardOverview, useGetAllHeatPredictions } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Activity, MapPin, Thermometer, Wind, Car, Leaf, ArrowRight, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { HeatZoneBadge } from "@/components/HeatZoneBadge";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { getHeatZoneHex } from "@/lib/utils";

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = useGetDashboardOverview();
  const { data: predictions, isLoading: predictionsLoading } = useGetAllHeatPredictions();

  if (overviewLoading || predictionsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground animate-pulse">Analyzing UP Urban Data...</p>
        </div>
      </div>
    );
  }

  if (!overview || !predictions) return <div className="p-8 text-center text-red-400">Failed to load dashboard data.</div>;

  const sortedPredictions = [...predictions].sort((a, b) => b.heatRiskScore - a.heatRiskScore);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Platform Overview</h1>
        <p className="text-muted-foreground">Real-time intelligence for Uttar Pradesh urban heat islands.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Monitored Cities" 
          value={overview.totalCities} 
          icon={<MapPin className="w-5 h-5" />}
          delay={0.1}
        />
        <StatCard 
          title="Avg Heat Risk" 
          value={(overview.avgHeatRisk || 0).toFixed(1)} 
          subtitle="Out of 100"
          icon={<Activity className="w-5 h-5" />}
          delay={0.2}
          trend={{ value: 2.4, label: "vs last week", isPositiveGood: false }}
        />
        <StatCard 
          title="Extreme Zones" 
          value={overview.extremeHeatCities || 0} 
          subtitle="Cities in red zone"
          icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
          className={(overview.extremeHeatCities || 0) > 0 ? "border-red-500/30" : ""}
          delay={0.3}
        />
        <StatCard 
          title="Avg Temperature" 
          value={`${(overview.avgTemperature || 0).toFixed(1)}°C`} 
          icon={<Thermometer className="w-5 h-5" />}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heat Risk Comparison Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/10"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">City Heat Risk Index</h3>
              <p className="text-sm text-muted-foreground">Current calculated risk score (0-100)</p>
            </div>
            <Link href="/analytics" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              Full Analytics <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedPredictions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="cityName" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip 
                  cursor={{ fill: 'hsla(226, 30%, 16%, 0.5)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="heatRiskScore" radius={[6, 6, 0, 0]}>
                  {sortedPredictions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getHeatZoneHex(entry.heatZone)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live City Feed */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-xl shadow-black/10 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Live Feed</h3>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
            {sortedPredictions.map((city) => (
              <Link 
                key={city.cityId} 
                href={`/city/${city.cityId}`}
                className="block p-4 rounded-xl border border-border hover:border-primary/50 bg-secondary/30 hover:bg-secondary transition-all duration-200 group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">{city.cityName}</span>
                  <HeatZoneBadge zone={city.heatZone} />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-4 h-4" />
                    {(city.temperature || 0).toFixed(1)}°C
                  </div>
                  <div className="flex items-center gap-1">
                    <Car className="w-4 h-4" />
                    {((city.vehicleDensity || 0) / 1000).toFixed(1)}k /km²
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
