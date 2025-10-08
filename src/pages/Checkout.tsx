import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Crown, Check } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiatingCheckout, setInitiatingCheckout] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

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

  const handleSignUpAndCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSigningUp(true);
    
    try {
      console.log('Signing up user...');
      const redirectUrl = `${window.location.origin}/checkout`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message);
        setIsSigningUp(false);
        return;
      }

      if (data.user) {
        console.log('User signed up successfully:', data.user.id);
        toast.success("Account created! Redirecting to checkout...");
        // The auth state change will trigger the checkout
      }
    } catch (error) {
      console.error('Exception during sign up:', error);
      toast.error('Failed to create account. Please try again.');
      setIsSigningUp(false);
    }
  };

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

  // If not logged in, show sign-up form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full border-2 border-primary">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl mb-2">Get Premium Access</CardTitle>
            <CardDescription className="text-lg">
              Create your account and subscribe for just $10/month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Sign Up Form */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Create Account</h3>
                <form onSubmit={handleSignUpAndCheckout} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSigningUp}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSigningUp}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={isSigningUp}
                  >
                    {isSigningUp ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Creating Account...
                      </>
                    ) : (
                      'Continue to Payment'
                    )}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto"
                      onClick={() => navigate('/auth?redirect=checkout')}
                    >
                      Sign in
                    </Button>
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">What's Included</h3>
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
                <div className="mt-6 pt-6 border-t">
                  <div className="text-center">
                    <span className="text-3xl font-bold">$10</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    Cancel anytime
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button 
                onClick={() => navigate("/")}
                variant="ghost"
              >
                Back to Home
              </Button>
            </div>
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
