import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { OrganizationStructuredData } from "@/components/StructuredData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import kensingtonLogo from "@/assets/kensington-logo-placeholder.png";

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title="Real Estate Investment Blog | Kensington Deals"
        description="Expert insights on Philadelphia real estate investment, Kensington neighborhood market trends, property analysis, and investment strategies for first-time investors."
        keywords="real estate blog, Philadelphia investment, Kensington market trends, real estate investing tips, property investment strategies"
        url="/blog"
      />
      <OrganizationStructuredData />
      
      <Navigation user={user} />
      
      <main className="flex-1">
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Real Estate Investment Blog
              </h1>
              <p className="text-xl text-muted-foreground">
                Expert insights, market analysis, and investment strategies for Philadelphia's Kensington neighborhood
              </p>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-56 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">No blog posts yet</h2>
                <p className="text-muted-foreground mb-6">Check back soon for expert real estate investment content!</p>
                {user && (
                  <Button asChild>
                    <a href="/blog-admin">Create First Post</a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Card 
                    key={post.id}
                    className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-card"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                  >
                    {/* Featured Image */}
                    {post.featured_image_url ? (
                      <div className="relative h-56 bg-muted overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        {post.category && (
                          <Badge 
                            variant="secondary" 
                            className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm"
                          >
                            {post.category}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="h-56 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center p-8">
                        <img 
                          src={kensingtonLogo} 
                          alt="Kensington Deals" 
                          className="w-full h-full object-contain opacity-40"
                        />
                      </div>
                    )}

                    <CardHeader className="space-y-3">
                      {!post.featured_image_url && post.category && (
                        <Badge variant="secondary" className="w-fit">
                          {post.category}
                        </Badge>
                      )}
                      
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-xl leading-tight">
                        {post.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <time dateTime={post.published_at}>
                            {formatDate(post.published_at)}
                          </time>
                        </div>
                        {post.read_time_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.read_time_minutes} min
                          </div>
                        )}
                      </div>

                      {/* Read More Link */}
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-primary font-medium group-hover:gap-2 transition-all"
                      >
                        Read Article 
                        <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
