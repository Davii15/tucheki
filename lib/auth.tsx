import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client for server components
export const createServerClient = () => {
  const cookieStore = cookies()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    },
  })
}

// Check if user is authenticated and is an admin
export async function isAdmin() {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return false
    }

    // Check if user has admin role in the profiles table
    const { data: profile, error } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (error || !profile) {
      return false
    }

    return profile.role === "admin"
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Get current session
export async function getSession() {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}
