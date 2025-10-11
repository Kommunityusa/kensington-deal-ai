import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function TriggerBlogGeneration() {
  const [loading, setLoading] = useState(false);

  const handleTrigger = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-generate-blog');
      
      if (error) throw error;
      
      toast.success(`New blog post created: ${data.title}`);
    } catch (error: any) {
      console.error('Error triggering blog generation:', error);
      toast.error(error.message || 'Failed to generate blog post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Blog Post Now</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Manually trigger AI blog post generation. A new post will be created automatically each day at 9 AM UTC.
        </p>
        <Button onClick={handleTrigger} disabled={loading}>
          {loading ? (
            "Generating..."
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Blog Post Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
