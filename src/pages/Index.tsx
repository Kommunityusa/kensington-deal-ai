import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Home, Search, MapPin, TrendingUp, Shield, Zap, Loader2, Check, Crown, GraduationCap, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LandingNewsCard from "@/components/LandingNewsCard";
import { TrendAnalysis } from "@/components/TrendAnalysis";
import Footer from "@/components/Footer";

const Index = () => {
  const [newsArticles, setNewsArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewsArticles();
  }, []);

  const fetchNewsArticles = async () => {
    console.log('Starting to fetch news articles...');
    try {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .not('image_url', 'is', null)
        .neq('image_url', '')
        .order('published_at', { ascending: false })
        .limit(6);

      console.log('Fetch news response:', { data, error });

      if (error) {
        console.error('Error fetching news:', error);
      }

      if (data) {
        console.log(`Received ${data.length} news articles`);
        setNewsArticles(data);
      }
    } catch (error) {
      console.error("Error fetching news articles:", error);
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
          <Badge variant="secondary" className="mb-2 md:mb-4 text-xs md:text-sm">
            <GraduationCap className="h-3 w-3 mr-1" />
            For First-Time Real Estate Investors
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Start Your Real Estate Journey in{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Kensington
            </span>
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Learn how to invest in Kensington real estate with data-driven insights, market analysis, and educational resources designed for new investors.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center pt-4 px-4">
            <Button size="lg" variant="hero" asChild className="w-full sm:w-auto">
              <Link to="/auth">Start Learning</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
              <Link to="/dashboard">Explore Market Data</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Market News Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">Kensington Market News</h2>
          </div>
          <p className="text-muted-foreground text-sm md:text-lg px-4">
            Stay informed with the latest market insights and development news
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : newsArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto mb-8 md:mb-12">
            {newsArticles.map((article) => (
              <LandingNewsCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No news articles available at the moment.</p>
        )}

        <div className="text-center px-4">
          <Button size="lg" variant="hero" asChild className="w-full sm:w-auto">
            <Link to="/news">View All News</Link>
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">100% Free for First-Time Investors</h2>
          <p className="text-muted-foreground text-lg">All educational tools and market data - no credit card required</p>
        </div>
        
        <Card className="max-w-2xl mx-auto hover-scale border-2 border-primary">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <CardTitle className="text-3xl">First-Time Investor Plan</CardTitle>
            </div>
            <div className="mt-4">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-muted-foreground text-xl">/month</span>
            </div>
            <CardDescription className="mt-2 text-base">
              Everything you need to start your real estate investment journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Beginner-friendly market insights</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">ROI calculators & investment guides</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Real-time market news & trends</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Property analysis templates</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Neighborhood revitalization insights</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Access to 500+ Kensington properties</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="font-medium">Educational resources for new investors</span>
              </li>
            </ul>
            <Button variant="hero" size="lg" className="w-full" asChild>
              <Link to="/auth">Start Learning Free</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Kensington?</h2>
          <p className="text-muted-foreground text-lg">Perfect for first-time real estate investors</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="hover-scale">
              <CardHeader>
                <GraduationCap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Beginner-Friendly</CardTitle>
                <CardDescription>
                  Step-by-step guidance designed specifically for first-time investors learning the fundamentals of real estate investing.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Emerging Market</CardTitle>
                <CardDescription>
                  Kensington is experiencing revitalization with properties under $300k - ideal entry points for new investors.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover-scale">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Educational Resources</CardTitle>
                <CardDescription>
                  Learn investment strategies, market analysis, and property evaluation through our comprehensive guides and tools.
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
            <h2 className="text-3xl md:text-4xl font-bold">Ready to Start Your Investment Journey?</h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Join other first-time investors learning about Kensington's emerging real estate market.
            </p>
            <Button size="lg" variant="secondary" asChild className="shadow-lg">
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
