import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, MapPin, TrendingUp, Shield, Zap, Loader2, Check, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LandingPropertyCard from "@/components/LandingPropertyCard";

const Index = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-properties', {
        body: { 
          filters: {
            propertyType: 'all'
          }
        }
      });

      if (!error && data?.properties) {
        // Show only first 6 properties on landing page
        setProperties(data.properties.slice(0, 6));
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Kensington Deals</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="text-sm hover:text-primary transition-colors">
              About
            </Link>
            <div className="flex gap-3">
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
              <Button variant="default" asChild>
                <Link to="/checkout">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <Badge variant="secondary" className="mb-4">Kensington, Philadelphia Real Estate</Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Real Estate Investment Analysis for{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Kensington
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Access property data and investment metrics for the Kensington neighborhood in Philadelphia. View property details, pricing information, and market analysis.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" variant="hero" asChild>
              <Link to="/auth">View Properties</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/dashboard">Browse Listings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Properties</h2>
          <p className="text-muted-foreground text-lg">Click any property to sign up and view full details</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            {properties.map((property) => (
              <LandingPropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        <div className="text-center">
          <Button size="lg" variant="hero" asChild>
            <Link to="/auth">Sign Up to View All Properties</Link>
          </Button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-muted-foreground text-lg">Start free or unlock premium features</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-2">
                Get started with basic property browsing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Browse featured properties</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>Basic property information</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span>View property photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">Limited to 6 properties</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/auth">Sign Up Free</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="hover-scale border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-primary text-white px-3 py-1 text-sm font-semibold">
              Popular
            </div>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Premium</CardTitle>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$10</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <CardDescription className="mt-2">
                Full access to all investment tools
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
                  <span className="font-medium">Export detailed reports</span>
                </li>
              </ul>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/checkout">Get Premium Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
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
