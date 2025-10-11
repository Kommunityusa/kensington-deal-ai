import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar } from "lucide-react";

interface LandingNewsCardProps {
  article: any;
}

export default function LandingNewsCard({ article }: LandingNewsCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const handleClick = () => {
    // Redirect to auth page instead of external link
    window.location.href = '/auth';
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer hover-scale group"
      onClick={handleClick}
    >
      <CardHeader className="p-0">
        <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ExternalLink className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="bg-background/95 text-foreground border border-border shadow-lg backdrop-blur-sm font-medium">
              {article.source || 'News'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        
        {article.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {article.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {formatDate(article.published_at)}
        </div>
      </CardContent>
    </Card>
  );
}
