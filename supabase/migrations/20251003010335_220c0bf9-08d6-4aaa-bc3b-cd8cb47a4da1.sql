-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Philadelphia',
  state TEXT DEFAULT 'PA',
  zip_code TEXT NOT NULL,
  price DECIMAL NOT NULL,
  bedrooms INTEGER,
  bathrooms DECIMAL,
  square_feet INTEGER,
  property_type TEXT,
  listing_url TEXT,
  image_url TEXT,
  description TEXT,
  year_built INTEGER,
  lot_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view properties"
  ON public.properties FOR SELECT
  TO authenticated
  USING (true);

-- Create property_analysis table
CREATE TABLE public.property_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  suggested_offer_price DECIMAL,
  estimated_renovation_cost DECIMAL,
  estimated_arv DECIMAL,
  estimated_roi DECIMAL,
  market_analysis TEXT,
  investment_grade TEXT,
  risk_assessment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.property_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property analysis"
  ON public.property_analysis FOR SELECT
  TO authenticated
  USING (true);

-- Create favorites table
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create saved_searches table
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved searches"
  ON public.saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create saved searches"
  ON public.saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete saved searches"
  ON public.saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_property_analysis_updated_at
  BEFORE UPDATE ON public.property_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample Kensington properties
INSERT INTO public.properties (address, zip_code, price, bedrooms, bathrooms, square_feet, property_type, description, year_built)
VALUES
  ('2145 E York St', '19125', 125000, 3, 1, 1200, 'Single Family', 'Great investment opportunity in Kensington. Needs full renovation.', 1920),
  ('3012 Kensington Ave', '19134', 89000, 2, 1, 950, 'Townhouse', 'Row home with potential. Sold as-is.', 1915),
  ('1845 E Somerset St', '19134', 95000, 3, 1.5, 1100, 'Single Family', 'Fixer-upper with good bones. Large lot.', 1925),
  ('2567 E Lehigh Ave', '19125', 145000, 4, 2, 1400, 'Multi-Family', 'Duplex with rental income potential.', 1930),
  ('3234 Frankford Ave', '19134', 78000, 2, 1, 850, 'Townhouse', 'Needs complete rehab. Priced to sell.', 1910);

-- Insert sample analysis data
INSERT INTO public.property_analysis (property_id, suggested_offer_price, estimated_renovation_cost, estimated_arv, estimated_roi, market_analysis, investment_grade, risk_assessment)
SELECT 
  id,
  price * 0.85,
  CASE 
    WHEN price < 100000 THEN 45000
    WHEN price < 130000 THEN 55000
    ELSE 65000
  END,
  CASE 
    WHEN price < 100000 THEN 180000
    WHEN price < 130000 THEN 220000
    ELSE 260000
  END,
  CASE 
    WHEN price < 100000 THEN 18.5
    WHEN price < 130000 THEN 15.2
    ELSE 12.8
  END,
  'Kensington market showing strong appreciation. High demand for renovated properties.',
  CASE 
    WHEN price < 100000 THEN 'A'
    WHEN price < 130000 THEN 'B+'
    ELSE 'B'
  END,
  'Medium risk. Area undergoing gentrification with improving market conditions.'
FROM public.properties;