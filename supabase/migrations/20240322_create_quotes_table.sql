-- Create quotes table
CREATE TABLE quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  main_asset TEXT NOT NULL,
  commitment_years INTEGER NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  quote_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Quote totals
  yearly_platform_fee DECIMAL(12,2),
  year_one_subscription DECIMAL(12,2),
  total_before_discount DECIMAL(12,2),
  discount_amount DECIMAL(12,2),
  final_total DECIMAL(12,2),
  
  -- JSON data for line items and other complex data
  line_items JSONB,
  rates JSONB,
  
  -- User tracking (if you have user authentication)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for better performance
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_quote_name ON quotes(quote_name);

-- Enable RLS (Row Level Security)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their own quotes
CREATE POLICY "Users can manage their own quotes" ON quotes
  FOR ALL USING (auth.uid() = user_id);

-- Policy for public read access (optional - adjust based on your needs)
CREATE POLICY "Quotes are viewable by everyone" ON quotes
  FOR SELECT USING (true);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
