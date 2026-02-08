
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://riqydupophnmumcibolp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DBw25_Gs3NEuQDs4PCXU3Q_OONl2AiL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
