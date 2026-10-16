import { createClient } from "@supabase/supabase-js";

// This is the explicitly selected Book vacation project (sakvxjyemhvzetlxhucd).
// Publishable/anon keys are intended for browser use; access is controlled by RLS.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://sakvxjyemhvzetlxhucd.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_SxGovbWi1inGbEhxzTKTuw_2_D_RtGM";

export const supabase = createClient(url, key);
