import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ijgzostzqpowlyllssjb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable__360GidmIYq8uYh6tfhjPw_POKDNDxf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
