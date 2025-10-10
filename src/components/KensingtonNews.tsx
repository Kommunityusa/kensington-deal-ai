import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Newspaper } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsArticle {
  title: string;
  url: string;
  description: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  sentiment?: string;
  sentiment_score?: number;
  sentiment_details?: {
    reasoning?: string;
  };
}

export const KensingtonNews = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      
      // Fetch news articles from database
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('Error fetching news:', error);
        return;
      }

      // If database is empty, fetch from API to populate it
      if (!data || data.length === 0) {
        console.log('Database empty, fetching fresh news...');
        const { data: apiData, error: apiError } = await supabase.functions.invoke('fetch-kensington-news');
        
        if (!apiError && apiData?.success) {
          // Trigger image and sentiment fetch
          supabase.functions.invoke('fetch-news-images').then(() => {
            console.log('Image fetch triggered');
          });
          supabase.functions.invoke('analyze-news-sentiment').then(() => {
            console.log('Sentiment analysis triggered');
          });
          
          // Refetch from database after API call populated it
          const { data: refreshedData } = await supabase
            .from('news_articles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(15);
          
          if (refreshedData) {
            setArticles(refreshedData.map(article => ({
              title: article.title,
              url: article.url,
              description: article.description || '',
              source: article.source || '',
              publishedAt: article.published_at || '',
              imageUrl: article.image_url || '',
              sentiment: article.sentiment || undefined,
              sentiment_score: article.sentiment_score || undefined,
              sentiment_details: article.sentiment_details as { reasoning?: string } || undefined,
            })));
          }
        }
      } else {
        setArticles(data.map(article => ({
          title: article.title,
          url: article.url,
          description: article.description || '',
          source: article.source || '',
          publishedAt: article.published_at || '',
          imageUrl: article.image_url || '',
          sentiment: article.sentiment || undefined,
          sentiment_score: article.sentiment_score || undefined,
          sentiment_details: article.sentiment_details as { reasoning?: string } || undefined,
        })));
        
        // If articles don't have images, trigger image fetch
        const hasNoImages = data.every(article => !article.image_url);
        if (hasNoImages) {
          console.log('Fetching images for articles...');
          supabase.functions.invoke('fetch-news-images').then(() => {
            console.log('Image fetch triggered, refreshing in 5 seconds...');
            setTimeout(() => fetchNews(), 5000);
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Newspaper className="h-6 w-6" />
          Kensington Real Estate News
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Newspaper className="h-6 w-6" />
        Kensington Real Estate News
      </h2>
      
      {articles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">No news articles found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow overflow-hidden">
              {article.imageUrl && (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={article.imageUrl} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">
                  {article.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 justify-between">
                  <span className="text-xs">{article.source}</span>
                  {article.sentiment && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      article.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      article.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {article.sentiment}
                      {article.sentiment_score && ` (${Math.round(article.sentiment_score * 100)}%)`}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {article.description}
                </p>
                {article.sentiment_details?.reasoning && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs font-semibold mb-1">AI Analysis</p>
                    <p className="text-xs text-muted-foreground">
                      {article.sentiment_details.reasoning}
                    </p>
                  </div>
                )}
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Read more
                  <ExternalLink className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
