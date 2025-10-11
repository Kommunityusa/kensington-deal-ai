import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { KensingtonNews } from "@/components/KensingtonNews";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const News = () => {
  const { user, loading: authLoading } = useAuth(true);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation user={user} />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <KensingtonNews />
      </main>
    </div>
  );
};

export default News;
