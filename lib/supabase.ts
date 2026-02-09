
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://riqydupophnmumcibolp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcXlkdXBvcGhubXVtY2lib2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0Njk0ODcsImV4cCI6MjA4NjA0NTQ4N30.I-ljTbYGlLH-excKEIxUrNbD0s7e52nwuGUlqsbVUTo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
