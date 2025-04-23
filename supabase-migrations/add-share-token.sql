-- Add share_token column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

-- Create index for faster lookups by share_token
CREATE INDEX IF NOT EXISTS idx_appointments_share_token ON appointments(share_token);

-- Create policy to allow public access to appointments via share_token
CREATE POLICY "Anyone can view appointments by share_token" 
  ON appointments FOR SELECT 
  USING (true);
