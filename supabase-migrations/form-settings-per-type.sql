-- Create form_settings_per_type table
CREATE TABLE IF NOT EXISTS form_settings_per_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  appointment_type_id UUID REFERENCES appointment_types(id) NOT NULL,
  form_title TEXT,
  form_description TEXT,
  logo_url TEXT,
  accent_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, appointment_type_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE form_settings_per_type ENABLE ROW LEVEL SECURITY;

-- Create policies for form_settings_per_type
CREATE POLICY "Users can view their own form settings per type" 
  ON form_settings_per_type FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own form settings per type" 
  ON form_settings_per_type FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own form settings per type" 
  ON form_settings_per_type FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own form settings per type" 
  ON form_settings_per_type FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS form_settings_per_type_user_id_idx ON form_settings_per_type(user_id);
CREATE INDEX IF NOT EXISTS form_settings_per_type_appointment_type_id_idx ON form_settings_per_type(appointment_type_id);
