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
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Market Trend Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Generating analysis from recent news articles...
            </p>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Our AI is analyzing the latest Kensington real estate news to provide you with market insights. This will be ready shortly.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-background border-primary/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Market Trend Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Based on {trendData.key_insights.total_articles} recent news articles • {trendData.sentiment_summary}
          </p>
        </div>
      </div>
      <div className="prose prose-sm max-w-none text-foreground">
        <p className="whitespace-pre-line">{trendData.analysis_text}</p>
      </div>
    </Card>
  );
};
