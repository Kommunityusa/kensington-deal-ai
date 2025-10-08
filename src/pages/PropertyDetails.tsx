import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Bed, Bath, Home, TrendingUp, DollarSign, Calendar, Ruler, Building2, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    fetchPropertyDetails();
  }, [id]);


  const fetchPropertyDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_analysis(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (error) {
      console.error("Error fetching property:", error);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      navigate("/");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const analysis = property?.property_analysis?.[0];


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Kensington RE</span>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }


  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl">Kensington RE</span>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </nav>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Kensington RE</span>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Property Image */}
          <div className="space-y-4">
            <div className="relative h-96 bg-muted rounded-lg overflow-hidden">
              {property.image_url ? (
                <img
                  src={property.image_url}
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Home className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Property Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-4xl font-bold">{formatCurrency(property.price)}</h1>
                <Badge variant="secondary">{property.property_type}</Badge>
              </div>
              <div className="flex items-center text-muted-foreground mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                <span className="text-lg">{property.address}, {property.city}, {property.state} {property.zip_code}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Bed className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{property.bedrooms}</div>
                    <div className="text-sm text-muted-foreground">Bedrooms</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Bath className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{property.bathrooms}</div>
                    <div className="text-sm text-muted-foreground">Bathrooms</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Ruler className="h-8 w-8 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{property.square_feet?.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Sq Ft</div>
                  </div>
                </CardContent>
              </Card>
              {property.year_built && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div>
                      <div className="text-2xl font-bold">{property.year_built}</div>
                      <div className="text-sm text-muted-foreground">Year Built</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {property.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{property.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Investment Analysis */}
        {analysis && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Investment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Estimated ROI</div>
                  <div className="text-3xl font-bold text-green-600">
                    {analysis.estimated_roi?.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Investment Grade</div>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {analysis.investment_grade}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">After Repair Value</div>
                  <div className="text-3xl font-bold">
                    {formatCurrency(analysis.estimated_arv)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Financial Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">List Price</span>
                      <span className="font-semibold">{formatCurrency(property.price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Suggested Offer</span>
                      <span className="font-semibold">{formatCurrency(analysis.suggested_offer_price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Est. Renovation Cost</span>
                      <span className="font-semibold">{formatCurrency(analysis.estimated_renovation_cost)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Total Investment</span>
                      <span className="font-bold">
                        {formatCurrency(analysis.suggested_offer_price + analysis.estimated_renovation_cost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold">Potential Profit</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(analysis.estimated_arv - (analysis.suggested_offer_price + analysis.estimated_renovation_cost))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Market Analysis</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{analysis.market_analysis}</p>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Risk Assessment</h4>
                      <p className="text-sm text-muted-foreground">{analysis.risk_assessment}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button size="lg" className="flex-1">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Make an Offer
                </Button>
                {property.listing_url && (
                  <Button size="lg" variant="outline" asChild className="flex-1">
                    <a href={property.listing_url} target="_blank" rel="noopener noreferrer">
                      View Original Listing
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
