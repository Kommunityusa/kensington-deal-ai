import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface TrendData {
  analysis_text: string;
  sentiment_summary: string | null;
  key_insights: any;
  updated_at: string;
}

export const TrendAnalysis = () => {
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendAnalysis();
    // Try to trigger analysis if no data exists
    triggerAnalysisIfNeeded();
  }, []);

  const triggerAnalysisIfNeeded = async () => {
    try {
      // Check if we need to trigger analysis
      const { data } = await supabase
        .from('trend_analysis')
        .select('id')
        .limit(1);
      
      if (!data || data.length === 0) {
        console.log('No trend data found, triggering analysis...');
        await supabase.functions.invoke('analyze-trends');
        // Wait a bit and refetch
        setTimeout(() => fetchTrendAnalysis(), 3000);
      }
    } catch (error) {
      console.error('Error checking/triggering analysis:', error);
    }
  };

  const fetchTrendAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('trend_analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setTrendData(data);
    } catch (error) {
      console.error('Error fetching trend analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-muted rounded w-full mb-2"></div>
        <div className="h-4 bg-muted rounded w-full mb-2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </Card>
    );
  }

  if (!trendData) {
    return (
      <Card className="overflow-hidden border-primary/10">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 md:px-6 py-3 border-b border-primary/10">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm md:text-base">Market Trends</h3>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <p className="text-sm text-muted-foreground">
            Analyzing latest market news...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/10 hover:border-primary/30 transition-colors">
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 md:px-6 py-3 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm md:text-base">Market Trends</h3>
          <span className="ml-auto text-xs text-muted-foreground">
            {trendData.sentiment_summary}
          </span>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <div className="space-y-2 text-sm md:text-base">
          {trendData.analysis_text.split('\n').filter(line => line.trim()).map((line, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span className="flex-1 leading-relaxed">{line.replace(/^[•\-]\s*/, '')}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
