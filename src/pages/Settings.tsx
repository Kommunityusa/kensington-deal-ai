import Navigation from "@/components/Navigation";
import PropertyNotificationSettings from "@/components/PropertyNotificationSettings";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/SEO";
import { BreadcrumbStructuredData } from "@/components/StructuredData";
import { Loader2, Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  const { user, loading: authLoading } = useAuth(true);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SEO 
          title="Settings - Kensington Deals"
          description="Manage your account settings and notification preferences"
          keywords="settings, notifications, account preferences"
          url="/settings"
        />
        <BreadcrumbStructuredData items={[
          { name: "Home", url: "/" },
          { name: "Settings", url: "/settings" }
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
        title="Settings - Kensington Deals"
        description="Manage your account settings and notification preferences"
        keywords="settings, notifications, account preferences"
        url="/settings"
      />
      <BreadcrumbStructuredData items={[
        { name: "Home", url: "/" },
        { name: "Settings", url: "/settings" }
      ]} />
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <SettingsIcon className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your account preferences and notification settings
            </p>
          </div>

          <div className="space-y-6">
            <PropertyNotificationSettings />
          </div>
        </div>
      </main>
    </div>
  );
}
