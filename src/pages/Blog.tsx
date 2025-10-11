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
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">No blog posts yet</h2>
                <p className="text-muted-foreground">Check back soon for expert real estate investment content!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                  <Card 
                    key={post.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                  >
                    {post.featured_image_url && (
                      <div className="relative h-48 bg-muted overflow-hidden rounded-t-lg">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardHeader>
                      {post.category && (
                        <Badge variant="secondary" className="w-fit mb-2">
                          {post.category}
                        </Badge>
                      )}
                      <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {post.excerpt && (
                        <p className="text-muted-foreground line-clamp-3 mb-4">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(post.published_at)}
                        </div>
                        {post.read_time_minutes && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {post.read_time_minutes} min read
                          </div>
                        )}
                      </div>
                      <Button variant="link" className="p-0 h-auto">
                        Read More <ArrowRight className="h-4 w-4 ml-1" />
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
