import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Check if environment variables are defined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required. Please check your environment variables.")
}

// Create a Supabase client for browser-side usage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Create a server-side client function (for server components and server actions)
export const createSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Database types based on our schema
export type Trailer = {
  id: string
  title: string
  description: string
  category: string
  thumbnail_url: string
  video_url: string
  director: string
  cast: string
  duration: string
  release_date: string
  created_at: string
  views: number
  likes: number
  comments: number
  featured: boolean
}

export type Ad = {
  id: string
  title: string
  description: string
  image_url: string
  link_url: string
  start_date: string
  end_date: string
  placement: string
  active: boolean
  created_at: string
}

export type Comment = {
  id: string
  trailer_id: string
  user_id: string
  content: string
  created_at: string
  user_name: string
}

export type Like = {
  id: string
  trailer_id: string
  user_id: string
  created_at: string
}

export type View = {
  id: string
  trailer_id: string
  session_id: string
  created_at: string
}
