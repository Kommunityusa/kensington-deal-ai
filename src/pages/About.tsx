import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Logo" className="h-8 w-8" />
            <span className="font-bold text-xl">Kensington Deals</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
              About Kensington Deals
            </h1>
            <p className="text-xl text-muted-foreground">
              Your trusted guide to first-time real estate investing in Philadelphia
            </p>
          </div>

          {/* Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Our Mission</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-muted-foreground">
                We empower first-time investors to make informed decisions in Philadelphia's Kensington 
                neighborhood by providing comprehensive market data, educational resources, and actionable 
                investment insights. Our goal is to democratize real estate investing and make it accessible 
                to everyone, regardless of experience level.
              </p>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Our Vision</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-muted-foreground">
                To become the most trusted platform for emerging real estate investors in Philadelphia, 
                helping them build wealth through smart, data-driven property investments while contributing 
                to the revitalization and growth of underserved neighborhoods.
              </p>
            </CardContent>
          </Card>

          {/* What We Offer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">What We Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Real-Time Property Data</h3>
                <p className="text-muted-foreground">
                  Access up-to-date listings from multiple sources, all in one place. We aggregate data 
                  from Zillow, Redfin, and other major platforms to give you a comprehensive view of 
                  available properties in Kensington.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">ROI Analysis & Market Intelligence</h3>
                <p className="text-muted-foreground">
                  Make data-driven decisions with our built-in return on investment calculators and 
                  market trend analysis. Understand property valuations, rental yield potential, and 
                  neighborhood growth patterns.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Educational Resources</h3>
                <p className="text-muted-foreground">
                  Learn the fundamentals of real estate investing through our curated content, market 
                  news, and investment guides specifically tailored for first-time investors.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Why Kensington */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Why Kensington?</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <p className="text-muted-foreground">
                Kensington represents one of Philadelphia's most dynamic emerging markets. With ongoing 
                revitalization efforts, improving infrastructure, and relatively affordable entry points, 
                the neighborhood offers unique opportunities for first-time investors. While challenges 
                exist, understanding the market deeply can lead to significant long-term gains.
              </p>
            </CardContent>
          </Card>

          {/* Built By Connex II Inc */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Built by Connex II Inc</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none dark:prose-invert space-y-4">
              <p className="text-muted-foreground">
                Kensington Deals is proudly developed by <strong>Connex II Inc</strong>, a Philadelphia-based 
                venture studio dedicated to building innovative solutions that empower businesses and communities.
              </p>
              
              <div className="space-y-3">
                <p className="font-semibold text-foreground">Our Portfolio:</p>
                
                <div>
                  <a href="https://kommunity.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    kommunity.app
                  </a>
                  <p className="text-muted-foreground mt-1">
                    A B2B events marketplace connecting businesses with curated Philadelphia events and networking opportunities.
                  </p>
                </div>
                
                <div>
                  <a href="https://cashflowai.biz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    cashflowai.biz
                  </a>
                  <p className="text-muted-foreground mt-1">
                    Philadelphia-focused bookkeeping software that simplifies financial management for local businesses.
                  </p>
                </div>
                
                <div>
                  <a href="https://referredai.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                    referredai.org
                  </a>
                  <p className="text-muted-foreground mt-1">
                    AI-powered referral and financial forms application streamlining paperwork and client onboarding.
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground mt-4">
                As a Philadelphia venture studio, we're committed to creating technology that serves our local 
                community while pushing the boundaries of innovation.
              </p>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-gradient-to-r from-primary/10 via-primary-glow/10 to-accent/10 border-primary/20">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="text-2xl font-bold">Ready to Start Your Investment Journey?</h2>
              <p className="text-muted-foreground">
                Join Kensington Deals today and get access to comprehensive market data and educational 
                resources—completely free.
              </p>
              <Link to="/auth">
                <Button size="lg" className="mt-4">
                  Get Started Free
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
