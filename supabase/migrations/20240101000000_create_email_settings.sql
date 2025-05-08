-- Create email_settings table
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_confirmation_subject TEXT,
  admin_confirmation_greeting TEXT,
  admin_confirmation_footer TEXT,
  client_confirmation_subject TEXT,
  client_confirmation_greeting TEXT,
  client_confirmation_footer TEXT,
  client_rejection_subject TEXT,
  client_rejection_greeting TEXT,
  client_rejection_footer TEXT,
  send_client_emails BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS email_settings_user_id_idx ON email_settings(user_id);

-- Create RLS policies
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Policy for selecting own email settings
CREATE POLICY "Users can view their own email settings" 
  ON email_settings FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for inserting own email settings
CREATE POLICY "Users can insert their own email settings" 
  ON email_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating own email settings
CREATE POLICY "Users can update their own email settings" 
  ON email_settings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for deleting own email settings
CREATE POLICY "Users can delete their own email settings" 
  ON email_settings FOR DELETE 
  USING (auth.uid() = user_id);
