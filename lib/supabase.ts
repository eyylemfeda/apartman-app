import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // Build sırasında hata vermemesi için konsola uyarı basıp boş değerle devam etmesini sağlayabiliriz
  console.warn("Supabase anahtarları eksik! Vercel panelini kontrol edin.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
