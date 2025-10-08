import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Kensington Deals</span>
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
      </nav>

      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">About Kensington Deals</Badge>
            <h1 className="text-5xl font-bold mb-6">Real Estate Investment Made Simple</h1>
            <p className="text-xl text-muted-foreground">
              We help investors make informed decisions in the Kensington neighborhood of Philadelphia
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Kensington Deals was created to provide real estate investors with comprehensive data 
                  and analysis tools focused on the Kensington neighborhood in Philadelphia. We believe 
                  that informed investors make better decisions, and better decisions lead to successful 
                  investments.
                </p>
                <p className="text-muted-foreground">
                  Our platform aggregates property data, market trends, and investment metrics to give 
                  you a complete picture of investment opportunities in one of Philadelphia's most dynamic 
                  neighborhoods.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What We Offer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Comprehensive Property Data</h3>
                  <p className="text-muted-foreground">
                    Access detailed information on properties including pricing, square footage, bedrooms, 
                    bathrooms, and property type.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">ROI Analysis</h3>
                  <p className="text-muted-foreground">
                    Our premium tools provide estimated return on investment calculations, suggested offer 
                    prices, renovation cost estimates, and after-repair values.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Market Intelligence</h3>
                  <p className="text-muted-foreground">
                    Stay informed with market data, comparable sales information, and neighborhood trends 
                    specific to Kensington.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Kensington?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Kensington is one of Philadelphia's most evolving neighborhoods, offering unique investment 
                  opportunities. By focusing specifically on this area, we provide deeper insights and more 
                  relevant data than general real estate platforms. Our specialization means better tools 
                  and more accurate analysis for Kensington investors.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-primary text-white border-0">
              <CardContent className="py-12 text-center space-y-6">
                <h2 className="text-3xl font-bold">Ready to Start Investing?</h2>
                <p className="text-lg text-white/90 max-w-2xl mx-auto">
                  Join Kensington Deals today and get access to comprehensive property data and investment tools
                </p>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/checkout">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 Kensington Deals. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
