
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hdduodfdzmoqdfudykpv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkZHVvZGZkem1vcWRmdWR5a3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTAyMzQsImV4cCI6MjA4NTg2NjIzNH0.p6ceLnMfdnDB3orkx1DLJ1YmZEF47Z1JQ2HytbllfK0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
