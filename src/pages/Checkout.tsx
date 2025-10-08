import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, Check } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiatingCheckout, setInitiatingCheckout] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        // Not logged in, redirect to auth
        navigate("/auth?redirect=checkout");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth?redirect=checkout");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleCheckout = async () => {
    setInitiatingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) {
        console.error('Error creating checkout:', error);
        toast.error('Failed to start checkout');
        setInitiatingCheckout(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error calling create-checkout:', error);
      toast.error('Failed to start checkout');
      setInitiatingCheckout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-2 border-primary">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Crown className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl mb-2">Upgrade to Premium</CardTitle>
          <CardDescription className="text-lg">
            Unlock all features for just $10/month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6">
            <div className="text-center mb-6">
              <span className="text-5xl font-bold">$10</span>
              <span className="text-muted-foreground text-xl">/month</span>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Unlimited property access</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Full ROI analysis & estimates</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Market data & comparable sales</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Property alerts & notifications</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Save favorite properties</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>Export detailed reports</span>
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleCheckout}
            disabled={initiatingCheckout}
            variant="hero"
            size="lg"
            className="w-full"
          >
            {initiatingCheckout ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Starting Checkout...
              </>
            ) : (
              'Continue to Checkout'
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Cancel anytime. No long-term commitment.</p>
          </div>

          <Button 
            onClick={() => navigate("/")}
            variant="ghost"
            className="w-full"
          >
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
