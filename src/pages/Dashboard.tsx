import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    propertyType: "all",
    sortBy: "newest"
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user, filters]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-properties', {
        body: { 
          filters: {
            minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
            propertyType: filters.propertyType
          }
        }
      });

      if (error) {
        console.error("Error fetching properties:", error);
        setProperties([]);
      } else {
        let propertiesList = data?.properties || [];
        
        // Apply sorting
        if (filters.sortBy === "price-low") {
          propertiesList.sort((a: any, b: any) => a.price - b.price);
        } else if (filters.sortBy === "price-high") {
          propertiesList.sort((a: any, b: any) => b.price - a.price);
        }
        
        setProperties(propertiesList);
      }
    } catch (error) {
      console.error("Error calling fetch-properties function:", error);
      setProperties([]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Kensington Investment Opportunities</h1>
          <p className="text-muted-foreground">AI-powered real estate analysis for Philadelphia's Kensington neighborhood</p>
        </div>

        <PropertyFilters filters={filters} setFilters={setFilters} />

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No properties found matching your criteria.</p>
          </div>
        )}
      </main>
    </div>
  );
}
