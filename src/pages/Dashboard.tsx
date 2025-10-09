import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Navigation from "@/components/Navigation";
import PropertyCard from "@/components/PropertyCard";
import PropertyFilters from "@/components/PropertyFilters";
import { Loader2, Crown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    propertyType: "all",
    sortBy: "newest"
  });

  const subscription = useSubscription(user);

  useEffect(() => {
    // Check for checkout success/cancel
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      toast.success('Successfully subscribed to Premium!');
      subscription.checkSubscription();
    } else if (checkout === 'cancel') {
      toast.error('Checkout canceled');
    }
  }, [searchParams]);

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
    console.log('Starting to fetch properties with filters:', filters);
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

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error("Error fetching properties:", error);
        toast.error(`Failed to fetch properties: ${error.message}`);
        setProperties([]);
      } else {
        let propertiesList = data?.properties || [];
        console.log(`Received ${propertiesList.length} properties`);
        
        // Apply sorting
        if (filters.sortBy === "price-low") {
          propertiesList.sort((a: any, b: any) => a.price - b.price);
        } else if (filters.sortBy === "price-high") {
          propertiesList.sort((a: any, b: any) => b.price - a.price);
        }
        
        setProperties(propertiesList);
        if (propertiesList.length > 0) {
          toast.success(`Loaded ${propertiesList.length} properties`);
        }
      }
    } catch (error) {
      console.error("Error calling fetch-properties function:", error);
      toast.error("Failed to fetch properties. Please try again.");
      setProperties([]);
    }
    setLoading(false);
  };

  const displayedProperties = subscription.subscribed ? properties : properties.slice(0, 6);

  // Show loading state if either properties or subscription is still loading
  const isLoading = loading || subscription.loading;

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
              <p className="text-muted-foreground">AI-powered real estate analysis for Philadelphia&apos;s Kensington neighborhood</p>
            </div>
            
            {!subscription.loading && !subscription.subscribed && (
              <Card className="bg-gradient-primary text-white border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    <CardTitle className="text-lg">Upgrade to Premium</CardTitle>
                  </div>
                  <CardDescription className="text-white/90">
                    Get unlimited access for $10/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={subscription.createCheckout}
                    variant="secondary"
                    className="w-full"
                  >
                    Subscribe Now
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {!subscription.loading && subscription.subscribed && (
              <Card className="border-2 border-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Premium Active</CardTitle>
                  </div>
                  <CardDescription>
                    {subscription.subscription_end && `Renews ${new Date(subscription.subscription_end).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>

        {!subscription.loading && !subscription.subscribed && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Free tier:</strong> You can view {displayedProperties.length} properties. Upgrade to Premium for unlimited access and full ROI analysis.
              </p>
            </CardContent>
          </Card>
        )}


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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} isPremium={subscription.subscribed} />
              ))}
            </div>
            
            {!subscription.subscribed && properties.length > 6 && (
              <Card className="mt-8 bg-gradient-primary text-white border-0">
                <CardContent className="py-8 text-center space-y-4">
                  <Crown className="h-12 w-12 mx-auto" />
                  <h3 className="text-2xl font-bold">Want to see {properties.length - 6} more properties?</h3>
                  <p className="text-white/90">Upgrade to Premium for unlimited property access and full analysis</p>
                  <Button 
                    onClick={subscription.createCheckout}
                    variant="secondary"
                    size="lg"
                  >
                    Upgrade to Premium - $10/month
                  </Button>
                </CardContent>
              </Card>
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
