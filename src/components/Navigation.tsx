import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, Plus, Home, Menu, X, Settings } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface NavigationProps {
  user: User | null;
}

export default function Navigation({ user }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="border-b bg-card sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg md:text-xl">Kensington RE</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Properties
            </Button>
          </Link>
          <Link to="/news">
            <Button variant="ghost" size="sm">
              News
            </Button>
          </Link>
          <Link to="/blog">
            <Button variant="ghost" size="sm">
              Blog
            </Button>
          </Link>
          {user && (
            <>
              <Link to="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link to="/list-property">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  List Property
                </Button>
              </Link>
            </>
          )}
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden lg:inline truncate max-w-[150px]">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px]">
            <div className="flex flex-col gap-4 mt-8">
              {user && (
                <div className="pb-4 border-b">
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
              
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="lg">
                  <Home className="h-5 w-5 mr-3" />
                  Properties
                </Button>
              </Link>
              
              <Link to="/news" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="lg">
                  News
                </Button>
              </Link>
              
              <Link to="/blog" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start" size="lg">
                  Blog
                </Button>
              </Link>
              
              {user && (
                <>
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <Settings className="h-5 w-5 mr-3" />
                      Settings
                    </Button>
                  </Link>
                  <Link to="/list-property" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <Plus className="h-5 w-5 mr-3" />
                      List Property
                    </Button>
                  </Link>
                </>
              )}
              
              <div className="pt-4 border-t mt-auto">
                {user ? (
                  <Button variant="outline" className="w-full" size="lg" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full" size="lg">Sign In</Button>
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
