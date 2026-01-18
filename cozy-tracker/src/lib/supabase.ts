import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    // We'll throw only if invoked, or handle gracefully during dev if waiting for env
    console.warn("Missing Supabase env vars")
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "")
