import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Bed, Bath, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LandingPropertyCardProps {
  property: any;
}

export default function LandingPropertyCard({ property }: LandingPropertyCardProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleClick = () => {
    navigate("/auth");
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer hover-scale"
      onClick={handleClick}
    >
      <CardHeader className="p-0">
        <div className="relative h-48 bg-muted rounded-t-lg overflow-hidden">
          {property.image_url ? (
            <img
              src={property.image_url}
              alt={property.address}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full"><svg class="h-16 w-16 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>';
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Home className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-2xl">{formatCurrency(property.price)}</h3>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          {property.address}
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1" />
            {property.bedrooms} bed
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1" />
            {property.bathrooms} bath
          </div>
          <div className="flex items-center">
            <Home className="h-4 w-4 mr-1" />
            {property.square_feet?.toLocaleString()} sqft
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
