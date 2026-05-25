import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tqyyszmxeaqiqvgdrfni.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxeXlzem14ZWFxaXF2Z2RyZm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTAyODMsImV4cCI6MjA5NTI2NjI4M30.CJEOP4tGKSFSbDwFBIKiAvTKyAeKo0gg7ZplR7GVOh8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
