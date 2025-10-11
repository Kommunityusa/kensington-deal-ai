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
      className="hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div className="relative h-56 bg-muted overflow-hidden">
        {property.image_url ? (
          <img
            src={property.image_url}
            alt={`Philadelphia investment property at ${property.address} - ${property.bedrooms} bed, ${property.bathrooms} bath`}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<div class="flex items-center justify-center h-full bg-muted"><svg class="h-16 w-16 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>';
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <Home className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <h3 className="font-bold text-xl">{formatCurrency(property.price)}</h3>
        
        <div className="flex items-start text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
          <span className="line-clamp-2">{property.address}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
          <div className="flex flex-col items-center">
            <Bed className="h-4 w-4 mb-1 text-muted-foreground" />
            <span className="font-medium">{property.bedrooms || 0}</span>
            <span className="text-xs text-muted-foreground">bed</span>
          </div>
          <div className="flex flex-col items-center">
            <Bath className="h-4 w-4 mb-1 text-muted-foreground" />
            <span className="font-medium">{property.bathrooms || 0}</span>
            <span className="text-xs text-muted-foreground">bath</span>
          </div>
          <div className="flex flex-col items-center">
            <Home className="h-4 w-4 mb-1 text-muted-foreground" />
            <span className="font-medium">{property.square_feet?.toLocaleString() || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">sqft</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
