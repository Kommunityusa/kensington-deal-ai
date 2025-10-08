import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Home, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PropertyCardProps {
  property: any;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate();
  const analysis = property.property_analysis?.[0];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getRoiColor = (roi: number) => {
    if (roi >= 15) return "text-green-600";
    if (roi >= 10) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-background/90">
              {property.property_type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-2xl">{formatCurrency(property.price)}</h3>
          {analysis && (
            <div className="text-right">
              <div className={`font-semibold ${getRoiColor(analysis.estimated_roi)}`}>
                {analysis.estimated_roi.toFixed(1)}% ROI
              </div>
              <div className="text-xs text-muted-foreground">Potential</div>
            </div>
          )}
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          {property.address}
        </div>

        <div className="flex items-center gap-4 text-sm mb-3">
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

        {analysis && (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Suggested Offer:</span>
              <span className="font-semibold">{formatCurrency(analysis.suggested_offer_price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Renovation:</span>
              <span className="font-semibold">{formatCurrency(analysis.estimated_renovation_cost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">After Repair Value:</span>
              <span className="font-semibold">{formatCurrency(analysis.estimated_arv)}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => navigate(`/property/${property.id}`)}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          View Full Analysis
        </Button>
      </CardFooter>
    </Card>
  );
}
