import { createClient } from '@supabase/supabase-js';

// Using your exact credentials as a fallback to guarantee it connects
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vifpcayqnrpglhlzhbyg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_igN-VKHQ0ijxtUIOlHSF7Q_CiX-GZhj';

export const supabase = createClient(supabaseUrl, supabaseKey);