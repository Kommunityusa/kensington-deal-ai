import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ArticleStructuredData, BreadcrumbStructuredData, FAQStructuredData, HowToStructuredData } from "@/components/StructuredData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (error) {
      console.error("Error fetching blog post:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation user={user} />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation user={user} />
        <main className="flex-1 container mx-auto px-4 py-16 text-center max-w-3xl">
          <h1 className="text-3xl font-bold mb-4">Blog Post Not Found</h1>
          <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title={post.meta_title || `${post.title} | Kensington Deals Blog`}
        description={post.meta_description || post.excerpt || post.title}
        keywords={post.meta_keywords || `real estate, Philadelphia, Kensington, investment`}
        image={post.featured_image_url}
        url={`/blog/${post.slug}`}
        type="article"
        article={{
          publishedTime: post.published_at,
          modifiedTime: post.updated_at,
          author: post.author
        }}
      />
      <ArticleStructuredData 
        title={post.title}
        description={post.excerpt || post.title}
        publishedAt={post.published_at}
        url={`${window.location.origin}/blog/${post.slug}`}
        imageUrl={post.featured_image_url}
      />
      <BreadcrumbStructuredData 
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${post.slug}` }
        ]}
      />
      {post.faqs && post.faqs.length > 0 && (
        <FAQStructuredData faqs={post.faqs} />
      )}
      {post.steps && post.steps.length > 0 && (
        <HowToStructuredData 
          name={post.title}
          description={post.excerpt || post.title}
          steps={post.steps}
        />
      )}
      
      <Navigation user={user} />
      
      <main className="flex-1">
        <article className="container mx-auto px-4 py-16 max-w-3xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/blog")}
            className="mb-12 -ml-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>

          {/* Category */}
          {post.category && (
            <div className="flex items-center gap-2 mb-8">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {post.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-12 pb-8 border-b">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            </div>
            {post.read_time_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.read_time_minutes} min read</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div 
            className="article-content"
            style={{
              fontSize: '18px',
              lineHeight: '1.8',
              color: 'hsl(var(--muted-foreground))'
            }}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-16 pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 p-8 bg-muted/50 rounded-lg text-center">
            <h3 className="text-2xl font-bold mb-3">Ready to Start Investing?</h3>
            <p className="text-muted-foreground mb-6">
              Explore investment opportunities in Philadelphia's Kensington neighborhood
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="/dashboard">Browse Properties</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/about">Learn More</a>
              </Button>
            </div>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
