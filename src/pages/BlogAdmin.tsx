import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import TriggerBlogGeneration from "@/components/TriggerBlogGeneration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export default function BlogAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Market Analysis",
    slug: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
    });
  };

  const generateContent = async () => {
    if (!formData.title) {
      toast.error("Please enter a blog title first");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-content", {
        body: { 
          title: formData.title,
          category: formData.category 
        },
      });

      if (error) throw error;

      setFormData({
        ...formData,
        excerpt: data.excerpt,
        content: data.content,
      });

      toast.success("AI content generated successfully!");
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast.error(error.message || "Failed to generate content");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const readTime = Math.ceil(formData.content.split(" ").length / 200);

      const { error } = await supabase.from("blog_posts").insert({
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        is_published: true,
        read_time_minutes: readTime,
        meta_title: `${formData.title} | Kensington Deals`,
        meta_description: formData.excerpt,
        meta_keywords: `${formData.category}, Philadelphia real estate, Kensington investment`,
      });

      if (error) throw error;

      toast.success("Blog post published successfully!");
      navigate("/blog");
    } catch (error: any) {
      console.error("Error publishing blog post:", error);
      toast.error(error.message || "Failed to publish blog post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
        <TriggerBlogGeneration />
        
        <Card>
          <CardHeader>
            <CardTitle>Create Blog Post Manually</CardTitle>
            <CardDescription>
              Use AI to generate SEO-optimized content for your real estate blog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Market Analysis">Market Analysis</SelectItem>
                    <SelectItem value="Investment Tips">Investment Tips</SelectItem>
                    <SelectItem value="Neighborhood Guide">Neighborhood Guide</SelectItem>
                    <SelectItem value="Property Analysis">Property Analysis</SelectItem>
                    <SelectItem value="Real Estate News">Real Estate News</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter blog post title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                />
              </div>

              <Button
                type="button"
                onClick={generateContent}
                disabled={generating || !formData.title}
                className="w-full"
                variant="secondary"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating AI Content...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Content
                  </>
                )}
              </Button>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary of the post..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content (HTML) *</Label>
                <Textarea
                  id="content"
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Blog post content in HTML..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Publishing..." : "Publish Blog Post"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
