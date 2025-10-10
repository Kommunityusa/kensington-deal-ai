import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, AlertTriangle } from "lucide-react";

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
      <div className="space-y-4">
        <h3 className="text-xl md:text-2xl font-bold">Market Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 bg-muted rounded-xl"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Parse the 3 bullet points - no truncation, show full sentences
  const bulletPoints = trendData.analysis_text
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^[•\-]\s*/, '').trim())
    .slice(0, 3);

  const cards = [
    {
      title: "Market Sentiment",
      icon: TrendingUp,
      content: bulletPoints[0] || "Analyzing...",
      gradient: "from-blue-500/10 to-blue-500/5",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600"
    },
    {
      title: "Key Opportunity",
      icon: Target,
      content: bulletPoints[1] || "Analyzing...",
      gradient: "from-green-500/10 to-green-500/5",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600"
    },
    {
      title: "Watch Out",
      icon: AlertTriangle,
      content: bulletPoints[2] || "Analyzing...",
      gradient: "from-orange-500/10 to-orange-500/5",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl md:text-2xl font-bold">Market Trends</h3>
        <Badge variant="secondary" className="text-xs">
          {trendData.sentiment_summary}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card 
              key={idx} 
              className="relative overflow-hidden hover:shadow-md transition-all"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`} />
              <div className="relative p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <h4 className="font-semibold text-sm">{card.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed min-h-[3rem]">
                  {card.content}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
