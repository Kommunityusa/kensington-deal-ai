import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bell, Loader2 } from "lucide-react";

export default function PropertyNotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email_notifications_enabled: true,
    min_price: "",
    max_price: "",
    min_bedrooms: "",
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('property_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          email_notifications_enabled: data.email_notifications_enabled,
          min_price: data.min_price?.toString() || "",
          max_price: data.max_price?.toString() || "",
          min_bedrooms: data.min_bedrooms?.toString() || "",
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const prefsData = {
        user_id: user.id,
        email_notifications_enabled: preferences.email_notifications_enabled,
        min_price: preferences.min_price ? parseFloat(preferences.min_price) : null,
        max_price: preferences.max_price ? parseFloat(preferences.max_price) : null,
        min_bedrooms: preferences.min_bedrooms ? parseInt(preferences.min_bedrooms) : null,
      };

      const { error } = await supabase
        .from('property_notification_preferences')
        .upsert(prefsData, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success("Notification preferences saved successfully!");
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error("Failed to save preferences: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Property Notifications
        </CardTitle>
        <CardDescription>
          Get email alerts when new properties match your criteria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notifications">Email Notifications</Label>
            <div className="text-sm text-muted-foreground">
              Receive alerts about matching properties
            </div>
          </div>
          <Switch
            id="email-notifications"
            checked={preferences.email_notifications_enabled}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, email_notifications_enabled: checked })
            }
          />
        </div>

        {preferences.email_notifications_enabled && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min-price">Min Price ($)</Label>
                <Input
                  id="min-price"
                  type="number"
                  placeholder="e.g., 100000"
                  value={preferences.min_price}
                  onChange={(e) =>
                    setPreferences({ ...preferences, min_price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-price">Max Price ($)</Label>
                <Input
                  id="max-price"
                  type="number"
                  placeholder="e.g., 300000"
                  value={preferences.max_price}
                  onChange={(e) =>
                    setPreferences({ ...preferences, max_price: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-bedrooms">Minimum Bedrooms</Label>
              <Input
                id="min-bedrooms"
                type="number"
                placeholder="e.g., 3"
                value={preferences.min_bedrooms}
                onChange={(e) =>
                  setPreferences({ ...preferences, min_bedrooms: e.target.value })
                }
              />
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
