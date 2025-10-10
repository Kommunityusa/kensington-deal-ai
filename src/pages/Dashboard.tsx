import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [totalProperties, setTotalProperties] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    propertyType: "all",
    sortBy: "newest"
  });


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);


  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
    fetchProperties();
  }, [filters]);


  // Fetch properties when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchProperties();
    }
  }, [currentPage]);

  const fetchProperties = async () => {
    setLoading(true);
    console.log('Starting to fetch properties with filters:', filters, 'page:', currentPage);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-properties', {
        body: { 
          filters: {
            minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
            maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
            propertyType: filters.propertyType
          },
          page: currentPage,
          limit: itemsPerPage
        }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error("Error fetching properties:", error);
        toast.error(`Failed to fetch properties: ${error.message}`);
        setProperties([]);
      } else {
        let propertiesList = data?.properties || [];
        const total = data?.total || 0;
        console.log(`Received ${propertiesList.length} properties out of ${total} total`);
        
        setTotalProperties(total);
        
        // Apply sorting
        if (filters.sortBy === "price-low") {
          propertiesList.sort((a: any, b: any) => a.price - b.price);
        } else if (filters.sortBy === "price-high") {
          propertiesList.sort((a: any, b: any) => b.price - a.price);
        }
        
        setProperties(propertiesList);
        if (propertiesList.length > 0) {
          toast.success(`Loaded ${propertiesList.length} properties (Page ${currentPage} of ${Math.ceil(total / itemsPerPage)})`);
        }
      }
    } catch (error) {
      console.error("Error calling fetch-properties function:", error);
      toast.error("Failed to fetch properties. Please try again.");
      setProperties([]);
    }
    setLoading(false);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProperties();
  };

  const totalPages = Math.ceil(totalProperties / itemsPerPage);
  const showPagination = totalPages > 1;

  // Show loading state
  const isLoading = loading;

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold">Kensington Investment Opportunities</h1>
                <Button
                  onClick={() => {
                    toast.info("Refreshing properties...");
                    fetchProperties();
                  }}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <p className="text-muted-foreground">Free property listings for Philadelphia&apos;s Kensington neighborhood</p>
            </div>
          </div>
        </div>


        <Card className="mb-6 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <strong>⚠️ Important Disclaimer:</strong> Property data may be outdated and should be independently verified. We do not endorse any specific deals or transactions. All users must conduct their own due diligence before making any investment decisions. This information is provided for educational purposes only and does not constitute financial, legal, or investment advice.
            </p>
          </CardContent>
        </Card>

        <PropertyFilters filters={filters} setFilters={setFilters} />

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              <p>Showing {properties.length} of {totalProperties} properties (Page {currentPage} of {totalPages})</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} isPremium={true} />
              ))}
            </div>
            
            {showPagination && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                  title="First page"
                >
                  First
                </Button>
                
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  variant="outline"
                >
                  Next
                </Button>
                
                <Button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || loading}
                  variant="outline"
                  title="Last page"
                >
                  Last
                </Button>
              </div>
            )}
            
          </>
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
