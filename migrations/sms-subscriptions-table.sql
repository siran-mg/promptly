-- Create sms_subscriptions table
CREATE TABLE IF NOT EXISTS sms_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  enabled BOOLEAN DEFAULT false,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE sms_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for sms_subscriptions
CREATE POLICY "Users can view their own sms subscriptions" 
  ON sms_subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sms subscriptions" 
  ON sms_subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sms subscriptions" 
  ON sms_subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sms subscriptions" 
  ON sms_subscriptions FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable real-time for the sms_subscriptions table
ALTER PUBLICATION supabase_realtime ADD TABLE sms_subscriptions;
