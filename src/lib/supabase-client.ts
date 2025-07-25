'use client'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zsbvdywfsigjokxdkmhy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYnZkeXdmc2lnam9reGRrbWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzQwNjUsImV4cCI6MjA2ODk1MDA2NX0.16_eN43t9_HvpgE1REuPIPDrcYr9nYYZi0D03NyiztM'

// Validate required environment variables
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

const isDevelopment = process.env.NODE_ENV === 'development'

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable in production to prevent auth loops
    flowType: 'implicit', // Use implicit flow for better production compatibility
    storageKey: 'zynex-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    debug: isDevelopment
  },
  global: {
    headers: {
      'X-Client-Info': 'zynex-ai-client',
      'apikey': supabaseAnonKey
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
})

// Add additional logging for production debugging
if (typeof window !== 'undefined') {
  console.log('🔗 Supabase Client Config:', {
    url: supabaseUrl,
    hasKey: !!supabaseAnonKey,
    environment: process.env.NODE_ENV,
    currentUrl: window.location.href
  })
}
