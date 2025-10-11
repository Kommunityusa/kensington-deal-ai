import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PropertyNotificationRequest {
  userEmail: string;
  userName?: string;
  property: {
    address: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    imageUrl?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, property }: PropertyNotificationRequest = await req.json();

    console.log('Sending property notification to:', userEmail);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const emailResponse = await resend.emails.send({
      from: "Kensington Deals <onboarding@resend.dev>",
      to: [userEmail],
      subject: `New Property Match: ${property.address}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #3d5068 0%, #5a7a9e 100%);
                color: white;
                padding: 30px 20px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 24px;
              }
              .content {
                padding: 30px 20px;
              }
              .property-image {
                width: 100%;
                height: 300px;
                object-fit: cover;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .property-details {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .price {
                font-size: 32px;
                font-weight: bold;
                color: #3d5068;
                margin: 10px 0;
              }
              .address {
                font-size: 18px;
                color: #666;
                margin-bottom: 15px;
              }
              .features {
                display: flex;
                gap: 20px;
                margin: 15px 0;
              }
              .feature {
                flex: 1;
                text-align: center;
                padding: 10px;
                background: white;
                border-radius: 6px;
              }
              .feature-value {
                font-size: 20px;
                font-weight: bold;
                color: #3d5068;
              }
              .feature-label {
                font-size: 12px;
                color: #666;
                text-transform: uppercase;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #3d5068 0%, #5a7a9e 100%);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏠 New Property Match!</h1>
              </div>
              
              <div class="content">
                ${userName ? `<p>Hi ${userName},</p>` : '<p>Hello!</p>'}
                
                <p>We found a new property in Kensington that matches your investment criteria:</p>
                
                ${property.imageUrl ? `<img src="${property.imageUrl}" alt="${property.address}" class="property-image" />` : ''}
                
                <div class="property-details">
                  <div class="price">${formatCurrency(property.price)}</div>
                  <div class="address">${property.address}</div>
                  
                  <div class="features">
                    <div class="feature">
                      <div class="feature-value">${property.bedrooms}</div>
                      <div class="feature-label">Bedrooms</div>
                    </div>
                    <div class="feature">
                      <div class="feature-value">${property.bathrooms}</div>
                      <div class="feature-label">Bathrooms</div>
                    </div>
                    <div class="feature">
                      <div class="feature-value">${property.squareFeet.toLocaleString()}</div>
                      <div class="feature-label">Sq Ft</div>
                    </div>
                  </div>
                </div>
                
                <p>This property could be a great investment opportunity! View the full details and ROI analysis now:</p>
                
                <center>
                  <a href="https://kensingtondeals.com/dashboard" class="cta-button">View Property Details →</a>
                </center>
                
                <p style="margin-top: 30px; color: #666; font-size: 14px;">
                  <strong>Why this property?</strong><br>
                  It matches your saved search criteria and is currently available in the Kensington area.
                </p>
              </div>
              
              <div class="footer">
                <p>You're receiving this because you subscribed to property notifications on Kensington Deals.</p>
                <p style="margin-top: 10px;">
                  <a href="https://kensingtondeals.com/dashboard" style="color: #3d5068;">Manage your preferences</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-property-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
