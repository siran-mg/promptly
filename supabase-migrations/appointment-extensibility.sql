-- Create appointment_types table
CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 60, -- Duration in minutes
  color TEXT, -- For calendar display
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointment_custom_fields table
CREATE TABLE IF NOT EXISTS appointment_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  appointment_type_id UUID REFERENCES appointment_types(id),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'email', 'phone', 'date', 'time', 'select', 'checkbox', 'textarea')),
  required BOOLEAN DEFAULT false,
  options JSONB, -- For select fields
  placeholder TEXT,
  default_value TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create appointment_field_values table
CREATE TABLE IF NOT EXISTS appointment_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES appointment_custom_fields(id) ON DELETE CASCADE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(appointment_id, field_id)
);

-- Add appointment_type_id to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type_id UUID REFERENCES appointment_types(id);

-- Add metadata column to appointments for future extensibility
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Set up Row Level Security (RLS)
-- Enable RLS on new tables
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_field_values ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment_types
CREATE POLICY "Users can view their own appointment types" 
  ON appointment_types FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointment types" 
  ON appointment_types FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointment types" 
  ON appointment_types FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointment types" 
  ON appointment_types FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for appointment_custom_fields
CREATE POLICY "Users can view their own appointment custom fields" 
  ON appointment_custom_fields FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointment custom fields" 
  ON appointment_custom_fields FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointment custom fields" 
  ON appointment_custom_fields FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointment custom fields" 
  ON appointment_custom_fields FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for appointment_field_values
-- These policies link through the appointment to ensure proper access control
CREATE POLICY "Users can view their own appointment field values" 
  ON appointment_field_values FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM appointments a 
      WHERE a.id = appointment_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert appointment field values for their appointments" 
  ON appointment_field_values FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments a 
      WHERE a.id = appointment_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update appointment field values for their appointments" 
  ON appointment_field_values FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM appointments a 
      WHERE a.id = appointment_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete appointment field values for their appointments" 
  ON appointment_field_values FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM appointments a 
      WHERE a.id = appointment_id AND a.user_id = auth.uid()
    )
  );

-- Create a default appointment type for existing users
INSERT INTO appointment_types (user_id, name, description, duration, is_default)
SELECT 
  id, 
  'Standard Appointment', 
  'Default appointment type', 
  60, 
  true
FROM auth.users
ON CONFLICT DO NOTHING;

-- Update existing appointments to use the default appointment type
UPDATE appointments a
SET appointment_type_id = (
  SELECT id FROM appointment_types at
  WHERE at.user_id = a.user_id AND at.is_default = true
  LIMIT 1
)
WHERE appointment_type_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointment_types_user_id ON appointment_types(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_custom_fields_user_id ON appointment_custom_fields(user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_custom_fields_type_id ON appointment_custom_fields(appointment_type_id);
CREATE INDEX IF NOT EXISTS idx_appointment_field_values_appointment_id ON appointment_field_values(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointments_type_id ON appointments(appointment_type_id);
