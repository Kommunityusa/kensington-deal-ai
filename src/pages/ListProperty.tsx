import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { BreadcrumbStructuredData } from "@/components/StructuredData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Home, DollarSign, Bed, Bath, Maximize, Calendar, Mail, Phone } from "lucide-react";

export default function ListProperty() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: "",
    zipCode: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    yearBuilt: "",
    propertyType: "SINGLE FAMILY",
    description: "",
    contactEmail: "",
    contactPhone: "",
  });

  const kensingtonZips = ["19125", "19134", "19122", "19137"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in to list a property");
        navigate("/auth");
        return;
      }

      if (!kensingtonZips.includes(formData.zipCode)) {
        toast.error("Only properties in Kensington (19125, 19134, 19122, 19137) can be listed");
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("properties").insert({
        user_id: user.id,
        listing_type: "user_listing",
        address: formData.address,
        city: "Philadelphia",
        state: "PA",
        zip_code: formData.zipCode,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms) || null,
        bathrooms: parseFloat(formData.bathrooms) || null,
        square_feet: parseInt(formData.squareFeet) || null,
        year_built: parseInt(formData.yearBuilt) || null,
        property_type: formData.propertyType,
        description: formData.description,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Property listed successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error listing property:", error);
      toast.error(error.message || "Failed to list property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="List Your Kensington Property | Free Property Listings | Kensington Deals"
        description="List your Kensington Philadelphia property for free. Reach qualified real estate investors looking for investment opportunities in zip codes 19125, 19134, 19122, and 19137."
        keywords="list property Kensington, sell property Philadelphia, free property listing, Kensington real estate, Philadelphia property for sale"
        url="/list-property"
      />
      <BreadcrumbStructuredData 
        items={[
          { name: 'Home', url: '/' },
          { name: 'List Property', url: '/list-property' }
        ]}
      />
      <Navigation user={null} />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-6 w-6" />
              List Your Kensington Property
            </CardTitle>
            <CardDescription>
              Free property listing for Kensington, Philadelphia. Only properties in zip codes 19125, 19134, 19122, or 19137 are accepted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Property Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Property Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code *</Label>
                  <Select
                    required
                    value={formData.zipCode}
                    onValueChange={(value) => setFormData({ ...formData, zipCode: value })}
                  >
                    <SelectTrigger id="zipCode">
                      <SelectValue placeholder="Select zip code" />
                    </SelectTrigger>
                    <SelectContent>
                      {kensingtonZips.map((zip) => (
                        <SelectItem key={zip} value={zip}>
                          {zip}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Asking Price *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="250000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bedrooms" className="flex items-center gap-2">
                      <Bed className="h-4 w-4" />
                      Bedrooms
                    </Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                      placeholder="3"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bathrooms" className="flex items-center gap-2">
                      <Bath className="h-4 w-4" />
                      Bathrooms
                    </Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      placeholder="2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="squareFeet" className="flex items-center gap-2">
                      <Maximize className="h-4 w-4" />
                      Square Feet
                    </Label>
                    <Input
                      id="squareFeet"
                      type="number"
                      value={formData.squareFeet}
                      onChange={(e) => setFormData({ ...formData, squareFeet: e.target.value })}
                      placeholder="1200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="yearBuilt" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Year Built
                    </Label>
                    <Input
                      id="yearBuilt"
                      type="number"
                      value={formData.yearBuilt}
                      onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                      placeholder="1920"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select
                    required
                    value={formData.propertyType}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  >
                    <SelectTrigger id="propertyType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE FAMILY">Single Family</SelectItem>
                      <SelectItem value="MULTI FAMILY">Multi Family</SelectItem>
                      <SelectItem value="CONDO">Condo</SelectItem>
                      <SelectItem value="TOWNHOUSE">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your property..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Email *
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Phone
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="(215) 555-0123"
                  />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Submitting..." : "List Property"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
