import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { KensingtonNews } from "@/components/KensingtonNews";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const News = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
