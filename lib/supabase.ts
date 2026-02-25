// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (supabaseInstance) return supabaseInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("❌ Supabase ENV eksik");
    return null;
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
}

// ✅ GERİYE UYUMLULUK: eski sayfalar import { supabase } kullanmaya devam etsin
export const supabase = getSupabase();
