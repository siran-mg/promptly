-- Enable real-time for the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Verify that real-time is enabled for the notifications table
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications';
