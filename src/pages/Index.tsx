import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Search, MapPin, TrendingUp, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">PropertyFinder</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button variant="default" asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
          <Badge variant="secondary" className="mb-4">Kensington, Philadelphia Investment Opportunities</Badge>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Discover High-ROI Properties in{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Kensington
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Data-driven investment analysis for real estate investors targeting Philadelphia's fastest-growing neighborhood. Find undervalued properties with maximum profit potential.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" variant="hero" asChild>
              <Link to="/auth">Start Analyzing Properties</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/dashboard">Browse Kensington Deals</Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-8 pt-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary">15%+</div>
              <div className="text-sm text-muted-foreground">Avg ROI</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Active Listings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">$200K+</div>
              <div className="text-sm text-muted-foreground">Avg Profit Potential</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Invest in Kensington?</h2>
          <p className="text-muted-foreground text-lg">The tools real estate investors need to maximize returns</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover-scale">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>ROI Analysis</CardTitle>
              <CardDescription>
                Get detailed investment return calculations on every property, including estimated renovation costs and after-repair values.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <MapPin className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Kensington Focus</CardTitle>
              <CardDescription>
                Specialized data for Philadelphia's Kensington neighborhood, one of the city's hottest investment markets.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <Search className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Market Intelligence</CardTitle>
              <CardDescription>
                Access real-time market data, comparable sales, and neighborhood trends to make informed investment decisions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>
                Every property includes a comprehensive risk analysis to help you avoid costly mistakes and bad deals.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Deal Alerts</CardTitle>
              <CardDescription>
                Get notified instantly when new high-ROI properties hit the market in your target areas.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-scale">
            <CardHeader>
              <Home className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Detailed Info</CardTitle>
              <CardDescription>
                View comprehensive property details including bedrooms, bathrooms, square footage, and more.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-primary text-white border-0 shadow-xl">
          <CardContent className="py-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Build Your Real Estate Portfolio?</h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Join savvy investors who are capitalizing on Kensington's growth. Start analyzing profitable deals today.
            </p>
            <Button size="lg" variant="secondary" asChild className="shadow-lg">
              <Link to="/auth">Get Started Now</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 PropertyFinder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
