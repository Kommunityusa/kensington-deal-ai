import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { KensingtonNews } from "@/components/KensingtonNews";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { BreadcrumbStructuredData } from "@/components/StructuredData";

const News = () => {
  const { user, loading: authLoading } = useAuth(true);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title="Kensington Real Estate News - Market Updates & Analysis"
          description="Stay informed with the latest Philadelphia Kensington real estate news, market trends, and investment insights. Expert analysis for property investors."
          keywords="Kensington news, Philadelphia real estate news, property market updates, investment news, housing trends Philadelphia"
          url="/news"
        />
        <BreadcrumbStructuredData items={[
          { name: "Home", url: "/" },
          { name: "News", url: "/news" }
        ]} />
        <Navigation user={user} />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Kensington Real Estate News - Market Updates & Analysis"
        description="Stay informed with the latest Philadelphia Kensington real estate news, market trends, and investment insights. Expert analysis for property investors."
        keywords="Kensington news, Philadelphia real estate news, property market updates, investment news, housing trends Philadelphia"
        url="/news"
      />
      <BreadcrumbStructuredData items={[
        { name: "Home", url: "/" },
        { name: "News", url: "/news" }
      ]} />
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <KensingtonNews />
      </main>
    </div>
  );
};

export default News;
