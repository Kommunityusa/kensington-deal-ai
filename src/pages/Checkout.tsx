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
      console.log('Auth state changed:', event, 'Has user:', !!session?.user);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', 'Has user:', !!session?.user);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleCheckout = async () => {
    console.log('Starting checkout process...');
    console.log('User:', user);
    
    if (!user) {
      console.error('No user found');
      toast.error('Please sign in first');
      navigate('/auth?redirect=checkout');
      return;
    }

    setInitiatingCheckout(true);
    
    try {
      console.log('Invoking create-checkout function...');
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      console.log('Response:', { data, error });
      
      if (error) {
        console.error('Error creating checkout:', error);
        toast.error(`Failed to start checkout: ${error.message}`);
        setInitiatingCheckout(false);
        return;
      }

      if (data?.url) {
        console.log('Redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
        toast.error('No checkout URL received');
        setInitiatingCheckout(false);
      }
    } catch (error) {
      console.error('Exception calling create-checkout:', error);
      toast.error('Failed to start checkout. Please try again.');
      setInitiatingCheckout(false);
    }
  };

  // Auto-trigger checkout if user is logged in
  useEffect(() => {
    if (user && !loading && !initiatingCheckout) {
      console.log('User is authenticated, auto-triggering checkout');
      handleCheckout();
    }
  }, [user, loading, initiatingCheckout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to continue with your premium subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/auth?redirect=checkout')}
              variant="hero"
              size="lg"
              className="w-full"
            >
              Sign In / Sign Up
            </Button>
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

          {initiatingCheckout ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-lg">Preparing your checkout...</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                You&apos;ll be redirected to Stripe in a moment
              </p>
            </div>
          ) : (
            <Button 
              onClick={handleCheckout}
              variant="hero"
              size="lg"
              className="w-full"
            >
              Continue to Checkout
            </Button>
          )}

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
