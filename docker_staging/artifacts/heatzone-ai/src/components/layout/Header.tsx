import { useState, useRef, useEffect } from "react";
import { useRefreshWeatherData, useGetCities } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { RefreshCw, Bell, Search, Menu, MapPin } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { data: cities } = useGetCities();

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredCities = searchQuery.trim()
    ? (Array.isArray(cities) ? cities : []).filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelect = (cityId: number) => {
    setSearchQuery("");
    setIsOpen(false);
    navigate(`/city/${cityId}`);
  };
  
  const refreshMutation = useRefreshWeatherData({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['/api/datasets/overview'] });
        queryClient.invalidateQueries({ queryKey: ['/api/heatzone/all'] });
        queryClient.invalidateQueries({ queryKey: ['/api/weather'] });
        
        toast({
          title: "Data Refreshed",
          description: `Successfully updated weather for ${data.citiesUpdated} cities.`,
        });
      },
      onError: () => {
        toast({
          title: "Refresh Failed",
          description: "Could not fetch latest weather data. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  return (
    <header className="h-20 bg-background/80 backdrop-blur-xl border-b border-border/50 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 ml-0 md:ml-64">
      <div className="flex items-center gap-4">
        <button onClick={onToggleSidebar} className="md:hidden p-2 text-muted-foreground hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:block relative" ref={searchRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
          <input 
            type="text" 
            placeholder="Search cities, regions..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => { if (searchQuery.trim()) setIsOpen(true); }}
            className="bg-secondary/50 border border-border/50 text-foreground text-sm rounded-full pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
          {isOpen && filteredCities.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl shadow-black/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Results</p>
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredCities.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleSelect(city.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/70 transition-colors text-left"
                  >
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>{city.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {isOpen && searchQuery.trim() && filteredCities.length === 0 && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl shadow-black/30 z-50 p-4 text-center text-sm text-muted-foreground">
              No cities found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden sm:block text-right">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Time</p>
          <p className="text-sm font-semibold text-foreground">{format(new Date(), 'MMM dd, yyyy • HH:mm')}</p>
        </div>

        <div className="h-8 w-px bg-border/50 hidden sm:block"></div>

        <button 
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold rounded-full border border-border/50 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none group"
        >
          <RefreshCw className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}`} />
          <span className="hidden sm:inline">{refreshMutation.isPending ? 'Syncing...' : 'Sync Data'}</span>
        </button>
        
        <button className="p-2 relative text-muted-foreground hover:text-foreground transition-colors bg-secondary/30 rounded-full hover:bg-secondary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background"></span>
        </button>
      </div>
    </header>
  );
}
