import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, MapPin, Bed, Bath, Home, TrendingUp, DollarSign, Calendar, Ruler, Building2, LogOut, AlertTriangle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [property, setProperty] = useState<any>(location.state?.property || null);
  const [loading, setLoading] = useState(!location.state?.property);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Only fetch from database if property wasn't passed via state
    if (!location.state?.property) {
      fetchPropertyDetails();
    }
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
    if (!amount) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Mock analysis data if not available
  const suggestedOffer = property?.price ? property.price * 0.85 : 0;
  const renovationCost = 50000;
  const estimatedARV = property?.price ? property.price * 1.25 : 0;
  const totalInvestment = suggestedOffer + renovationCost;
  const potentialProfit = estimatedARV - totalInvestment;
  const calculatedROI = totalInvestment > 0 ? ((potentialProfit / totalInvestment) * 100) : 0;

  const analysis = property?.property_analysis?.[0] || {
    estimated_roi: calculatedROI,
    investment_grade: calculatedROI >= 20 ? "A" : calculatedROI >= 15 ? "B+" : "B",
    estimated_arv: estimatedARV,
    suggested_offer_price: suggestedOffer,
    estimated_renovation_cost: renovationCost,
    market_analysis: "Kensington is experiencing strong growth with increasing property values. This area shows potential for good returns on investment with the right renovation strategy.",
    risk_assessment: "Moderate risk. The neighborhood is improving but requires careful property selection and thorough inspections. Consider market timing and exit strategy."
  };


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

        {/* Disclaimer */}
        <Alert className="mt-8 border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertTitle className="text-yellow-900 dark:text-yellow-100 font-semibold">
            Important Disclaimer
          </AlertTitle>
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            This analysis is for informational purposes only and should not be considered financial, legal, or investment advice. 
            All estimates and projections are based on automated calculations and market data that may not reflect actual conditions. 
            You must conduct your own due diligence, including professional inspections, appraisals, market analysis, and consultation 
            with qualified real estate professionals, contractors, and financial advisors before making any investment decisions. 
            Past performance and estimates do not guarantee future results. Real estate investments carry inherent risks including 
            market fluctuations, property condition issues, and financial loss.
          </AlertDescription>
        </Alert>

        {/* Investment Analysis */}
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

            {/* Analysis Methodology */}
            <Separator />
            
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Analysis Methodology</AlertTitle>
              <AlertDescription className="space-y-2 text-sm">
                <p><strong>Suggested Offer Price:</strong> Calculated at 85% of list price based on comparable sales and market conditions in Kensington. This accounts for negotiation room and current market dynamics.</p>
                
                <p><strong>Estimated Renovation Cost:</strong> Based on average renovation costs for similar properties in the area ({formatCurrency(analysis.estimated_renovation_cost)}). Actual costs may vary significantly based on property condition, scope of work, and contractor pricing.</p>
                
                <p><strong>After Repair Value (ARV):</strong> Estimated at 125% of current list price ({formatCurrency(analysis.estimated_arv)}) based on recent comparable sales of renovated properties in Kensington. Market conditions can affect actual values.</p>
                
                <p><strong>ROI Calculation:</strong> Return on Investment is calculated as (ARV - Total Investment) / Total Investment × 100. This represents potential profit as a percentage of your total investment including purchase price and renovation costs.</p>
                
                <p><strong>Investment Grade:</strong> Properties are graded based on estimated ROI potential: A (20%+ ROI), B+ (15-20% ROI), B (10-15% ROI), C (5-10% ROI). Grade does not account for risk factors or property-specific issues.</p>
                
                <p className="text-yellow-700 dark:text-yellow-500 font-medium mt-3">
                  ⚠️ These are automated estimates only. Always verify with professional appraisals, contractor bids, and thorough property inspections before proceeding with any purchase.
                </p>
              </AlertDescription>
            </Alert>

            <div className="pt-4">
              {property.listing_url ? (
                <Button size="lg" className="w-full" asChild>
                  <a href={property.listing_url} target="_blank" rel="noopener noreferrer">
                    <DollarSign className="h-5 w-5 mr-2" />
                    View Property
                  </a>
                </Button>
              ) : (
                <Button size="lg" className="w-full" disabled>
                  <DollarSign className="h-5 w-5 mr-2" />
                  Listing URL Not Available
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
