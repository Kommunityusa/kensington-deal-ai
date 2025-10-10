import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

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
      <div className="space-y-3">
        <h3 className="text-lg md:text-xl font-semibold mb-4">Market Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Parse the 3 bullet points
  const bulletPoints = trendData.analysis_text
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^[•\-]\s*/, '').trim())
    .slice(0, 3);

  const cards = [
    {
      title: "Market Sentiment",
      icon: TrendingUp,
      content: bulletPoints[0] || "Analyzing market direction...",
      color: "primary"
    },
    {
      title: "Key Opportunity",
      icon: TrendingUp,
      content: bulletPoints[1] || "Identifying opportunities...",
      color: "primary"
    },
    {
      title: "Watch Out",
      icon: AlertCircle,
      content: bulletPoints[2] || "Assessing risks...",
      color: "destructive"
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg md:text-xl font-semibold">Market Trends</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {trendData.sentiment_summary}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card 
              key={idx} 
              className="p-4 hover:shadow-lg transition-all border-l-4"
              style={{ borderLeftColor: card.color === 'destructive' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${card.color === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${card.color === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-2">{card.title}</h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {card.content}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
