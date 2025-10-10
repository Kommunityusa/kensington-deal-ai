import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Building2, LogOut, Plus, Home } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface NavigationProps {
  user: User | null;
}

export default function Navigation({ user }: NavigationProps) {
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Kensington RE</span>
          </Link>
          
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
            {user && (
              <Link to="/list-property">
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  List Property
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
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
    </nav>
  );
}
