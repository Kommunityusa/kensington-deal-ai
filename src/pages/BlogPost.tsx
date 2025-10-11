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
        <article className="container mx-auto px-4 py-8 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/blog")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>

          {post.featured_image_url && (
            <div className="relative h-96 bg-muted rounded-lg overflow-hidden mb-8">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          )}

          <header className="mb-8">
            {post.category && (
              <Badge variant="secondary" className="mb-4">
                {post.category}
              </Badge>
            )}
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.published_at)}</span>
              </div>
              {post.read_time_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.read_time_minutes} min read</span>
                </div>
              )}
            </div>

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          <Separator className="mb-8" />

          <div 
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
