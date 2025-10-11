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
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
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
      
      <main className="flex-1">
        {/* Hero Section with Featured Image */}
        {post.featured_image_url && (
          <div className="relative h-[400px] bg-muted overflow-hidden">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        <article className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/blog")}
            className="mb-8 -ml-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>

          {/* Article Header */}
          <header className={`mb-12 ${post.featured_image_url ? '-mt-32 relative z-10' : ''}`}>
            <div className="space-y-6">
              {/* Category Badge */}
              {post.category && (
                <Badge variant="secondary" className="text-sm px-4 py-1.5">
                  {post.category}
                </Badge>
              )}
              
              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                {post.title}
              </h1>
              
              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{post.author}</span>
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

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </header>

          <Separator className="mb-12" />

          {/* Article Content */}
          <div 
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8
              prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6
              prose-p:text-lg prose-p:leading-relaxed prose-p:mb-8
              prose-ul:my-8 prose-ul:space-y-3 prose-li:my-2
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:shadow-lg prose-img:my-10"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Article Footer */}
          <div className="mt-16 pt-8 border-t space-y-8">
            {/* Call to Action */}
            <div className="bg-primary/5 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-3">Ready to Start Investing?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
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
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
