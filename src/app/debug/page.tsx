"use client"

import { useState, useEffect } from 'react'
import { supabaseClient as supabase } from '@/lib/supabase-client'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({})
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    const gatherDebugInfo = async () => {
      const info: Record<string, unknown> = {
        // Environment info
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        currentUrl: typeof window !== 'undefined' ? window.location.href : 'SSR',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
        
        // Supabase client info
        clientExists: !!supabase,
        
        // Session info
        session: null,
        authConfig: null,
        sessionError: null
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        info.session = session ? {
          hasUser: !!session.user,
          userEmail: session.user?.email,
          expiresAt: session.expires_at
        } : null
        info.sessionError = error
      } catch (error) {
        info.sessionError = error
      }

      setDebugInfo(info)
    }

    gatherDebugInfo()
  }, [])

  const testAuth = async () => {
    setTestResult('Testing authentication...')
    
    try {
      const testEmail = 'test@example.com'
      const testPassword = 'test123456'
      
      console.log('Starting auth test...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (error) {
        setTestResult(`Auth Error: ${error.message}`)
        console.error('Auth error:', error)
      } else {
        setTestResult(`Auth Success: ${data.user?.email}`)
        console.log('Auth success:', data)
      }
    } catch (error) {
      setTestResult(`Network Error: ${error}`)
      console.error('Network error:', error)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Environment Info</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Auth Test</h2>
          <button 
            onClick={testAuth}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Authentication
          </button>
          {testResult && (
            <div className="mt-3 p-3 bg-white dark:bg-gray-700 rounded">
              <strong>Result:</strong> {testResult}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Deploy this page to your production environment</li>
            <li>Check the Environment Info section for missing variables</li>
            <li>Verify the Supabase URL matches your project</li>
            <li>Check browser console for additional errors</li>
            <li>Test with your actual credentials (not the test ones)</li>
          </ol>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Common Issues</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Production URL not added to Supabase Auth settings</li>
            <li>Environment variables not set in deployment platform</li>
            <li>CORS issues with Supabase configuration</li>
            <li>Incorrect redirect URLs in Supabase dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
