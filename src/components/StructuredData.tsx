import { Helmet } from "react-helmet-async";

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  property_type?: string;
  description?: string;
  image_url?: string;
}

export const PropertyStructuredData = ({ property }: { property: Property }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": `${property.address}, ${property.city}, ${property.state}`,
    "description": property.description || `Investment property at ${property.address}`,
    "url": `${window.location.origin}/property/${property.id}`,
    "image": property.image_url,
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.address,
      "addressLocality": property.city,
      "addressRegion": property.state,
      "postalCode": property.zip_code,
      "addressCountry": "US"
    },
    ...(property.bedrooms && { "numberOfRooms": property.bedrooms }),
    ...(property.bathrooms && { "numberOfBathroomsTotal": property.bathrooms }),
    ...(property.square_feet && { "floorSize": { "@type": "QuantitativeValue", "value": property.square_feet, "unitText": "square feet" } })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const OrganizationStructuredData = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kensington Deals",
    "description": "Philadelphia real estate investment platform focusing on Kensington neighborhood properties",
    "url": window.location.origin,
    "logo": `${window.location.origin}/favicon.png`,
    "foundingDate": "2025",
    "founders": [
      {
        "@type": "Organization",
        "name": "Connex II Inc"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Philadelphia",
      "addressRegion": "PA",
      "addressCountry": "US"
    },
    "sameAs": [
      "https://kommunity.app",
      "https://cashflowai.biz",
      "https://referredai.org"
    ],
    "areaServed": {
      "@type": "City",
      "name": "Philadelphia"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const LocalBusinessStructuredData = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Kensington Deals",
    "description": "Real estate investment platform for Philadelphia's Kensington neighborhood",
    "url": window.location.origin,
    "telephone": "",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Philadelphia",
      "addressRegion": "PA",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "39.9905",
      "longitude": "-75.1252"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "00:00",
      "closes": "23:59"
    },
    "priceRange": "Free"
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const ArticleStructuredData = ({ 
  title, 
  description, 
  publishedAt, 
  url, 
  imageUrl 
}: { 
  title: string; 
  description: string; 
  publishedAt: string; 
  url: string; 
  imageUrl?: string;
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": title,
    "description": description,
    "url": url,
    "datePublished": publishedAt,
    "dateModified": publishedAt,
    "author": {
      "@type": "Organization",
      "name": "Kensington Deals"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Kensington Deals",
      "logo": {
        "@type": "ImageObject",
        "url": `${window.location.origin}/favicon.png`
      }
    },
    ...(imageUrl && { "image": imageUrl })
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const BreadcrumbStructuredData = ({ items }: { items: { name: string; url: string }[] }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${window.location.origin}${item.url}`
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const FAQStructuredData = ({ faqs }: { faqs: { question: string; answer: string }[] }) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export const HowToStructuredData = ({ 
  name, 
  description, 
  steps 
}: { 
  name: string; 
  description: string; 
  steps: { name: string; text: string }[] 
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};
