import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Search, MapPin, TrendingUp, Shield, Zap, Loader2, Check, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LandingPropertyCard from "@/components/LandingPropertyCard";
import { TrendAnalysis } from "@/components/TrendAnalysis";

const Index = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    console.log('Starting to fetch properties...');
    try {
      const { data, error } = await supabase.functions.invoke('fetch-properties', {
        body: { 
          filters: {
            propertyType: 'all'
          }
        }
      });

      console.log('Fetch properties response:', { data, error });

      if (error) {
        console.error('Error from edge function:', error);
      }

      if (!error && data?.properties) {
        console.log(`Received ${data.properties.length} properties`);
        // Show only properties with images on landing page
        const propertiesWithImages = data.properties.filter((p: any) => p.image_url && p.image_url.trim() !== '');
        setProperties(propertiesWithImages.slice(0, 6));
      } else {
        console.log('No properties in response');
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <span className="text-lg md:text-xl font-bold">Kensington Deals</span>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <Link to="/about" className="text-xs md:text-sm hover:text-primary transition-colors">
              About
            </Link>
            <div className="flex gap-2 md:gap-3">
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 animate-fade-in">
          <Badge variant="secondary" className="mb-2 md:mb-4 text-xs md:text-sm">Kensington, Philadelphia Real Estate</Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Real Estate Investment Analysis for{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Kensington
            </span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Access property data and investment metrics for the Kensington neighborhood in Philadelphia. View property details, pricing information, and market analysis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4 px-4">
            <Button size="lg" variant="hero" asChild className="w-full sm:w-auto">
              <Link to="/auth">View Properties</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/dashboard">Browse Listings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4">Featured Properties</h2>
          <p className="text-muted-foreground text-sm md:text-lg px-4">Click any property to sign up and view full details</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto mb-8 md:mb-12">
            {properties.map((property) => (
              <LandingPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        <div className="text-center px-4">
          <Button size="lg" variant="hero" asChild className="w-full sm:w-auto">
            <Link to="/auth">Sign Up to View All Properties</Link>
          </Button>
        </div>
      </section>

      {/* Trend Analysis Section */}
      <section className="container mx-auto px-4 py-12">
        <TrendAnalysis />
      </section>

      {/* Free Access Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">100% Free Access</h2>
          <p className="text-muted-foreground text-lg">All features included - no credit card required</p>
        </div>
        
        <Card className="max-w-2xl mx-auto hover-scale border-2 border-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Free Forever</CardTitle>
            <div className="mt-4">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-muted-foreground text-xl">/month</span>
            </div>
            <CardDescription className="mt-2 text-base">
              Complete access to all investment tools and property data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Unlimited property access</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Full ROI analysis & estimates</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Market data & comparable sales</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Property alerts & notifications</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Save favorite properties</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">List your own properties</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Export detailed reports</span>
              </li>
            </ul>
            <Button variant="hero" size="lg" className="w-full" asChild>
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Features</h2>
          <p className="text-muted-foreground text-lg">Tools for real estate analysis</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover-scale">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>ROI Estimates</CardTitle>
              <CardDescription>
                View estimated return on investment calculations for properties, including renovation costs and after-repair values.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <MapPin className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Neighborhood Data</CardTitle>
              <CardDescription>
                Property information focused on the Kensington neighborhood in Philadelphia.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <Search className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Market Data</CardTitle>
              <CardDescription>
                Access market information, comparable sales, and neighborhood trends for reference.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Property Assessment</CardTitle>
              <CardDescription>
                Each property includes information to help with evaluation and due diligence.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Receive alerts when new properties matching your criteria become available.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <Home className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Property Details</CardTitle>
              <CardDescription>
                View property information including bedrooms, bathrooms, square footage, and pricing.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-primary text-white border-0 shadow-xl">
          <CardContent className="py-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Explore Kensington Properties</h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Browse available properties and access detailed investment information.
            </p>
            <Button size="lg" variant="secondary" asChild className="shadow-lg">
              <Link to="/auth">Get Started</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 Kensington Deals. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
