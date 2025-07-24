'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zsbvdywfsigjokxdkmhy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYnZkeXdmc2lnam9reGRrbWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzQwNjUsImV4cCI6MjA2ODk1MDA2NX0.16_eN43t9_HvpgE1REuPIPDrcYr9nYYZi0D03NyiztM'

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
