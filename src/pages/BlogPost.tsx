import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { ArticleStructuredData, BreadcrumbStructuredData } from "@/components/StructuredData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, User, BookOpen } from "lucide-react";
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
        <main className="flex-1 container mx-auto px-4 py-8">
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
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
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
      
      <Navigation user={user} />
      
      <main className="flex-1 bg-background">
        <article className="container mx-auto px-4 py-12 max-w-4xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/blog")}
            className="mb-12 -ml-3 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>

          {/* Article Header - Clean & Simple */}
          <header className="mb-16 space-y-8">
            {/* Category Badge */}
            {post.category && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <span className="text-primary font-medium text-sm">
                  {post.category}
                </span>
              </div>
            )}
            
            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-foreground">
              {post.title}
            </h1>

            {/* Meta Information - Single Row */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
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
          </header>

          {/* Article Content with Better Spacing */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
              prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6 prose-h2:font-bold
              prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-4 prose-h3:font-semibold
              prose-p:text-lg prose-p:leading-[1.8] prose-p:mb-8 prose-p:text-muted-foreground
              prose-ul:my-8 prose-ul:space-y-3 prose-li:text-muted-foreground prose-li:leading-relaxed
              prose-ol:my-8 prose-ol:space-y-3
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:transition-all
              prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:bg-muted/30 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r prose-blockquote:not-italic prose-blockquote:my-8
              prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:my-8
              prose-img:rounded-lg prose-img:shadow-md prose-img:my-12 prose-img:mx-auto
              prose-hr:my-12 prose-hr:border-border"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags Section */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-16 pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-sm px-4 py-1.5 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Article Footer - CTA */}
          <div className="mt-16 pt-8 border-t">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-10 text-center border border-primary/10">
              <h3 className="text-3xl font-bold mb-4 text-foreground">Ready to Start Investing in Kensington?</h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Explore curated investment opportunities with detailed analysis and market insights
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="px-8" asChild>
                  <a href="/dashboard">Browse Properties</a>
                </Button>
                <Button size="lg" variant="outline" className="px-8" asChild>
                  <a href="/about">Learn More About Us</a>
                </Button>
              </div>
            </div>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
