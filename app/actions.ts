"use server"

import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"
import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/auth"

interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

interface SubscriptionData {
  email: string
}

export async function sendContactEmail(data: ContactFormData) {
  try {
    // In a real application, you would use environment variables for these settings
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "your-email@gmail.com", // This would be an environment variable in production
        pass: "your-password", // This would be an environment variable in production
      },
    })

    // Email content
    const mailOptions = {
      from: `"Tucheki Contact Form" <your-email@gmail.com>`,
      to: "waikwa1@yahoo.com", // Recipient email
      subject: `Tucheki Contact: ${data.subject}`,
      text: `
        Name: ${data.name}
        Email: ${data.email}
        Subject: ${data.subject}
        
        Message:
        ${data.message}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #b45309;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <div style="margin-top: 20px;">
            <p><strong>Message:</strong></p>
            <p style="background-color: #f9f5eb; padding: 15px; border-radius: 5px;">${data.message.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
      `,
    }

    // In a real application, you would actually send the email
    // For now, we'll just simulate success
    console.log("Would send email with the following data:", mailOptions)

    // Simulate a delay to mimic sending
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return { success: true }
  } catch (error) {
    console.error("Error sending email:", error)
    throw new Error("Failed to send email")
  }
}

export async function subscribeToNewsletter(data: SubscriptionData) {
  try {
    // In a real application, you would use environment variables for these settings
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "your-email@gmail.com", // This would be an environment variable in production
        pass: "your-password", // This would be an environment variable in production
      },
    })

    // Email content
    const mailOptions = {
      from: `"Tucheki Newsletter" <your-email@gmail.com>`,
      to: "waikwa1@yahoo.com", // Recipient email
      subject: `New Newsletter Subscription`,
      text: `
        New subscriber: ${data.email}
        
        This user has subscribed to the Tucheki newsletter.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #b45309;">New Newsletter Subscription</h2>
          <p><strong>Email:</strong> ${data.email}</p>
          <p>This user has subscribed to the Tucheki newsletter.</p>
        </div>
      `,
    }

    // In a real application, you would actually send the email
    // For now, we'll just simulate success
    console.log("Would send subscription notification with the following data:", mailOptions)

    // Simulate a delay to mimic sending
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return { success: true }
  } catch (error) {
    console.error("Error processing subscription:", error)
    throw new Error("Failed to process subscription")
  }
}

// New social interaction functions

// Get or create a session ID for tracking views
export async function getSessionId() {
  const cookieStore = cookies()
  let sessionId = cookieStore.get("tucheki_session_id")?.value

  if (!sessionId) {
    sessionId = uuidv4()
    cookieStore.set("tucheki_session_id", sessionId, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })
  }

  return sessionId
}

// Get trailer details
export async function getTrailerDetails(id: string) {
  try {
    const supabase = createClient()

    // Fetch trailer data
    const { data: trailer, error } = await supabase.from("trailers").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching trailer details:", error)
      return { trailer: null, success: false }
    }

    // Track view if trailer exists
    if (trailer) {
      await trackTrailerView(id)
    }

    return { trailer, success: true }
  } catch (error) {
    console.error("Error in getTrailerDetails:", error)
    return { trailer: null, success: false }
  }
}

// Get related trailers
export async function getRelatedTrailers(currentId: string, category: string) {
  try {
    const supabase = createClient()

    // Fetch related trailers with same category but different ID
    const { data: trailers, error } = await supabase
      .from("trailers")
      .select("id, title, thumbnail, views, duration, category")
      .eq("category", category)
      .neq("id", currentId)
      .limit(6)

    if (error) {
      console.error("Error fetching related trailers:", error)
      return { trailers: [], success: false }
    }

    return { trailers, success: true }
  } catch (error) {
    console.error("Error in getRelatedTrailers:", error)
    return { trailers: [], success: false }
  }
}

// Track trailer view
async function trackTrailerView(trailerId: string) {
  try {
    const supabase = createClient()
    const cookieStore = cookies()

    // Get session ID from cookie or create new one
    let sessionId = cookieStore.get("tucheki_session_id")?.value

    if (!sessionId) {
      sessionId = uuidv4()
      cookieStore.set("tucheki_session_id", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      })
    }

    // Get user ID if logged in
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // Check if this session has already viewed this trailer recently
    const { data: existingView } = await supabase
      .from("views")
      .select("id")
      .eq("trailer_id", trailerId)
      .eq("session_id", sessionId)
      .gte("created_at", new Date(Date.now() - 3600000).toISOString()) // Within last hour
      .maybeSingle()

    // If no recent view, insert new view record
    if (!existingView) {
      await supabase.from("views").insert({
        trailer_id: trailerId,
        user_id: userId || null,
        session_id: sessionId,
      })

      // Increment view count on trailer
      await supabase.rpc("increment_trailer_views", { trailer_id: trailerId })
    }

    return { success: true }
  } catch (error) {
    console.error("Error tracking view:", error)
    return { success: false }
  }
}

// Like/unlike trailer
export async function toggleTrailerLike(trailerId: string) {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { success: false, error: "Authentication required", liked: false }
    }

    const userId = session.user.id

    // Check if user already liked this trailer
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("trailer_id", trailerId)
      .eq("user_id", userId)
      .maybeSingle()

    if (existingLike) {
      // Unlike: Remove like record
      await supabase.from("likes").delete().eq("id", existingLike.id)

      // Decrement like count
      await supabase.rpc("decrement_trailer_likes", { trailer_id: trailerId })

      return { success: true, liked: false }
    } else {
      // Like: Add like record
      await supabase.from("likes").insert({
        trailer_id: trailerId,
        user_id: userId,
      })

      // Increment like count
      await supabase.rpc("increment_trailer_likes", { trailer_id: trailerId })

      return { success: true, liked: true }
    }
  } catch (error) {
    console.error("Error toggling like:", error)
    return { success: false, error: "Failed to process like", liked: false }
  }
}

// Check if user has liked trailer
export async function checkTrailerLike(trailerId: string) {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { liked: false, success: true }
    }

    const userId = session.user.id

    // Check if like record exists
    const { data, error } = await supabase
      .from("likes")
      .select("id")
      .eq("trailer_id", trailerId)
      .eq("user_id", userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return { liked: !!data, success: true }
  } catch (error) {
    console.error("Error checking like status:", error)
    return { liked: false, success: false }
  }
}

// Add comment to trailer
export async function addComment(trailerId: string, content: string) {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return { success: false, error: "Authentication required" }
    }

    const userId = session.user.id

    // Insert comment
    const { data, error } = await supabase
      .from("comments")
      .insert({
        trailer_id: trailerId,
        user_id: userId,
        content,
      })
      .select()

    if (error) {
      throw error
    }

    // Increment comment count
    await supabase.rpc("increment_trailer_comments", { trailer_id: trailerId })

    // Revalidate page to show new comment
    revalidatePath(`/trailers/${trailerId}`)

    return { success: true, comment: data[0] }
  } catch (error) {
    console.error("Error adding comment:", error)
    return { success: false, error: "Failed to add comment" }
  }
}

// Get comments for trailer
export async function getComments(trailerId: string) {
  try {
    const supabase = createClient()

    // Fetch comments with user info
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        user:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq("trailer_id", trailerId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return { comments: data, success: true }
  } catch (error) {
    console.error("Error fetching comments:", error)
    return { comments: [], success: false }
  }
}

// Share trailer
export async function shareTrailer(trailerId: string, platform: string) {
  try {
    const supabase = createClient()

    // Get user ID if logged in
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const userId = session?.user?.id

    // Record share
    await supabase.from("shares").insert({
      trailer_id: trailerId,
      user_id: userId || null,
      platform,
    })

    return { success: true }
  } catch (error) {
    console.error("Error recording share:", error)
    return { success: false }
  }
}

// Get featured trailers for homepage
// export async function getFeaturedTrailers() {
//   try {
//     const supabase = createClient()

//     const { data, error } = await supabase
//       .from("trailers")
//       .select("id, title, description, category, thumbnail, duration, views, likes, trending")
//       .eq("featured", true)
//       .limit(6)

//     if (error) {
//       throw error
//     }

//     return { trailers: data, success: true }
//   } catch (error) {
//     console.error("Error fetching featured trailers:", error)
//     return { trailers: [], success: false }
//   }
// }

// Get new releases
export async function getNewReleases() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("trailers")
      .select("id, title, category, thumbnail, duration, release_date")
      .order("release_date", { ascending: false })
      .limit(6)

    if (error) {
      throw error
    }

    return { trailers: data, success: true }
  } catch (error) {
    console.error("Error fetching new releases:", error)
    return { trailers: [], success: false }
  }
}

// Get trending categories
export async function getTrendingCategories() {
  try {
    const supabase = createClient()

    // Get distinct categories with trailer counts
    const { data, error } = await supabase.from("trailers").select("category").order("category")

    if (error) {
      throw error
    }

    // Count trailers per category and get unique categories
    const categories = Array.from(new Set(data.map((item) => item.category)))
      .map((category) => {
        const count = data.filter((item) => item.category === category).length
        return { category, count }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    return { categories, success: true }
  } catch (error) {
    console.error("Error fetching trending categories:", error)
    return { categories: [], success: false }
  }
}

// Get continue watching for user
export async function getContinueWatching() {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Get session ID from cookie
    const cookieStore = cookies()
    const sessionId = cookieStore.get("tucheki_session_id")?.value

    if (!session?.user && !sessionId) {
      return { trailers: [], success: true }
    }

    // Query based on user ID if logged in, otherwise session ID
    let query = supabase
      .from("views")
      .select(`
        trailer_id,
        created_at,
        trailers:trailer_id (
          id,
          title,
          thumbnail,
          duration,
          category
        )
      `)
      .order("created_at", { ascending: false })
      .limit(6)

    if (session?.user) {
      query = query.eq("user_id", session.user.id)
    } else if (sessionId) {
      query = query.eq("session_id", sessionId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    // Format data and remove duplicates (keep most recent view of each trailer)
    const uniqueTrailers = data.reduce((acc: any[], current) => {
      const trailer = current.trailers
      const exists = acc.find((item) => item.id === trailer.id)

      if (!exists && trailer) {
        acc.push({
          id: trailer.id,
          title: trailer.title,
          thumbnail: trailer.thumbnail,
          duration: trailer.duration,
          category: trailer.category,
          last_watched: current.created_at,
        })
      }

      return acc
    }, [])

    return { trailers: uniqueTrailers, success: true }
  } catch (error) {
    console.error("Error fetching continue watching:", error)
    return { trailers: [], success: false }
  }
}

// Get all trailers with pagination
export async function getAllTrailers(page = 1, limit = 12, category?: string, search?: string) {
  try {
    const supabase = createClient()
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from("trailers")
      .select("id, title, description, category, thumbnail, duration, views, likes, trending, release_date", {
        count: "exact",
      })

    // Apply filters if provided
    if (category) {
      query = query.eq("category", category)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order("release_date", { ascending: false })

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    return {
      trailers: data || [],
      success: true,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: count ? Math.ceil(count / limit) : 0,
      },
    }
  } catch (error) {
    console.error("Error fetching all trailers:", error)
    return {
      trailers: [],
      success: false,
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    }
  }
}

// Admin login
export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "Email and password are required" }
  }

  const supabase = createServerClient()

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      // Sign out if not an admin
      await supabase.auth.signOut()
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Admin logout
export async function adminLogout() {
  const supabase = createServerClient()

  try {
    await supabase.auth.signOut()
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// Get all trailers
export async function getTrailers() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("trailers").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, trailers: data || [] }
  } catch (error) {
    console.error("Error fetching trailers:", error)
    return { success: false, trailers: [], error: "Failed to fetch trailers" }
  }
}

// Get featured trailers
export async function getFeaturedTrailers() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("trailers")
      .select("*")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      throw error
    }

    return { success: true, trailers: data || [] }
  } catch (error) {
    console.error("Error fetching featured trailers:", error)
    return { success: false, trailers: [], error: "Failed to fetch featured trailers" }
  }
}

// Get trailer by ID
export async function getTrailerById(id: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("trailers").select("*").eq("id", id).single()

    if (error) {
      throw error
    }

    return { success: true, trailer: data }
  } catch (error) {
    console.error(`Error fetching trailer with ID ${id}:`, error)
    return { success: false, trailer: null, error: "Failed to fetch trailer" }
  }
}

// Create trailer
export async function createTrailer(formData: FormData) {
  const supabase = createServerClient()

  try {
    // Check if user is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Extract trailer data from form
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const video_url = formData.get("video_url") as string
    const thumbnail_url = formData.get("thumbnail_url") as string
    const director = formData.get("director") as string
    const cast = formData.get("cast") as string
    const duration = formData.get("duration") as string
    const release_date = formData.get("release_date") as string
    const featured = formData.get("featured") === "on"

    // Validate required fields
    if (!title || !description || !category || !video_url) {
      return { success: false, error: "Title, description, category, and video URL are required" }
    }

    // Insert trailer into database
    const { data, error } = await supabase
      .from("trailers")
      .insert([
        {
          title,
          description,
          category,
          video_url,
          thumbnail_url,
          director,
          cast,
          duration,
          release_date,
          featured,
          views: 0,
          likes: 0,
          comments: 0,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    // Revalidate relevant paths
    revalidatePath("/admin")
    revalidatePath("/trailers")
    revalidatePath("/")

    return { success: true, trailer: data[0] }
  } catch (error) {
    console.error("Error creating trailer:", error)
    return { success: false, error: "Failed to create trailer" }
  }
}

// Update trailer
export async function updateTrailer(id: string, formData: FormData) {
  const supabase = createServerClient()

  try {
    // Check if user is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Extract trailer data from form
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const video_url = formData.get("video_url") as string
    const thumbnail_url = formData.get("thumbnail_url") as string
    const director = formData.get("director") as string
    const cast = formData.get("cast") as string
    const duration = formData.get("duration") as string
    const release_date = formData.get("release_date") as string
    const featured = formData.get("featured") === "on"

    // Validate required fields
    if (!title || !description || !category || !video_url) {
      return { success: false, error: "Title, description, category, and video URL are required" }
    }

    // Update trailer in database
    const { data, error } = await supabase
      .from("trailers")
      .update({
        title,
        description,
        category,
        video_url,
        thumbnail_url,
        director,
        cast,
        duration,
        release_date,
        featured,
      })
      .eq("id", id)
      .select()

    if (error) {
      throw error
    }

    // Revalidate relevant paths
    revalidatePath("/admin")
    revalidatePath(`/trailers/${id}`)
    revalidatePath("/trailers")
    revalidatePath("/")

    return { success: true, trailer: data[0] }
  } catch (error) {
    console.error(`Error updating trailer with ID ${id}:`, error)
    return { success: false, error: "Failed to update trailer" }
  }
}

// Delete trailer
export async function deleteTrailer(id: string) {
  const supabase = createServerClient()

  try {
    // Check if user is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Delete related records first
    await supabase.from("comments").delete().eq("trailer_id", id)
    await supabase.from("likes").delete().eq("trailer_id", id)
    await supabase.from("views").delete().eq("trailer_id", id)

    // Delete the trailer
    const { error } = await supabase.from("trailers").delete().eq("id", id)

    if (error) {
      throw error
    }

    // Revalidate relevant paths
    revalidatePath("/admin")
    revalidatePath("/trailers")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error(`Error deleting trailer with ID ${id}:`, error)
    return { success: false, error: "Failed to delete trailer" }
  }
}

// Track trailer view
export async function trackView(trailerId: string) {
  const supabase = createServerClient()
  const cookieStore = cookies()

  try {
    // Generate a session ID if one doesn't exist
    let sessionId = cookieStore.get("tucheki_session_id")?.value

    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15)
      cookies().set("tucheki_session_id", sessionId, {
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })
    }

    // Check if this session has already viewed this trailer
    const { data: existingView } = await supabase
      .from("views")
      .select("id")
      .eq("trailer_id", trailerId)
      .eq("session_id", sessionId)
      .single()

    if (existingView) {
      // Already viewed, don't count again
      return { success: true, alreadyViewed: true }
    }

    // Record the view
    await supabase.from("views").insert([
      {
        trailer_id: trailerId,
        session_id: sessionId,
      },
    ])

    // Increment the view count in the trailers table
    const { data: trailer } = await supabase.from("trailers").select("views").eq("id", trailerId).single()

    if (trailer) {
      await supabase
        .from("trailers")
        .update({ views: (trailer.views || 0) + 1 })
        .eq("id", trailerId)
    }

    // Revalidate the trailer page
    revalidatePath(`/trailers/${trailerId}`)

    return { success: true }
  } catch (error) {
    console.error(`Error tracking view for trailer ${trailerId}:`, error)
    return { success: false, error: "Failed to track view" }
  }
}

// Get comments for a trailer
export async function getTrailerComments(trailerId: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles:user_id(username)")
      .eq("trailer_id", trailerId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    // Format the comments to include the username
    const formattedComments = data.map((comment) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user_name: comment.profiles?.username || "Anonymous",
      user_id: comment.user_id,
    }))

    return { success: true, comments: formattedComments }
  } catch (error) {
    console.error(`Error fetching comments for trailer ${trailerId}:`, error)
    return { success: false, comments: [], error: "Failed to fetch comments" }
  }
}

// Add comment to a trailer
export async function addTrailerComment(trailerId: string, content: string) {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "You must be logged in to comment" }
    }

    // Add the comment
    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          trailer_id: trailerId,
          user_id: session.user.id,
          content,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    // Increment the comment count in the trailers table
    const { data: trailer } = await supabase.from("trailers").select("comments").eq("id", trailerId).single()

    if (trailer) {
      await supabase
        .from("trailers")
        .update({ comments: (trailer.comments || 0) + 1 })
        .eq("id", trailerId)
    }

    // Revalidate the trailer page
    revalidatePath(`/trailers/${trailerId}`)

    return { success: true, comment: data[0] }
  } catch (error) {
    console.error(`Error adding comment to trailer ${trailerId}:`, error)
    return { success: false, error: "Failed to add comment" }
  }
}

// Like a trailer
export async function likeTrailer(trailerId: string) {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "You must be logged in to like a trailer" }
    }

    // Check if user has already liked this trailer
    const { data: existingLike } = await supabase
      .from("likes")
      .select("id")
      .eq("trailer_id", trailerId)
      .eq("user_id", session.user.id)
      .single()

    if (existingLike) {
      // User has already liked this trailer, so unlike it
      await supabase.from("likes").delete().eq("id", existingLike.id)

      // Decrement the like count in the trailers table
      const { data: trailer } = await supabase.from("trailers").select("likes").eq("id", trailerId).single()

      if (trailer && trailer.likes > 0) {
        await supabase
          .from("trailers")
          .update({ likes: trailer.likes - 1 })
          .eq("id", trailerId)
      }

      // Revalidate the trailer page
      revalidatePath(`/trailers/${trailerId}`)

      return { success: true, liked: false }
    }

    // User hasn't liked this trailer yet, so add a like
    await supabase.from("likes").insert([
      {
        trailer_id: trailerId,
        user_id: session.user.id,
      },
    ])

    // Increment the like count in the trailers table
    const { data: trailer } = await supabase.from("trailers").select("likes").eq("id", trailerId).single()

    if (trailer) {
      await supabase
        .from("trailers")
        .update({ likes: (trailer.likes || 0) + 1 })
        .eq("id", trailerId)
    }

    // Revalidate the trailer page
    revalidatePath(`/trailers/${trailerId}`)

    return { success: true, liked: true }
  } catch (error) {
    console.error(`Error liking trailer ${trailerId}:`, error)
    return { success: false, error: "Failed to like trailer" }
  }
}

// Check if user has liked a trailer
export async function hasLikedTrailer(trailerId: string) {
  const supabase = createServerClient()

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: true, hasLiked: false }
    }

    const { data } = await supabase
      .from("likes")
      .select("id")
      .eq("trailer_id", trailerId)
      .eq("user_id", session.user.id)
      .single()

    return { success: true, hasLiked: !!data }
  } catch (error) {
    console.error(`Error checking if user has liked trailer ${trailerId}:`, error)
    return { success: true, hasLiked: false }
  }
}

// Get related trailers
export async function getRelatedTrailersList(trailerId: string, category: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("trailers")
      .select("*")
      .eq("category", category)
      .neq("id", trailerId)
      .limit(4)

    if (error) {
      throw error
    }

    return { success: true, trailers: data || [] }
  } catch (error) {
    console.error(`Error fetching related trailers for ${trailerId}:`, error)
    return { success: false, trailers: [], error: "Failed to fetch related trailers" }
  }
}

// Get all ads
export async function getAds() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("ads").select("*").order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return { success: true, ads: data || [] }
  } catch (error) {
    console.error("Error fetching ads:", error)
    return { success: false, ads: [], error: "Failed to fetch ads" }
  }
}

// Create ad
export async function createAd(formData: FormData) {
  const supabase = createServerClient()

  try {
    // Check if user is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Extract ad data from form
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const image_url = formData.get("image_url") as string
    const link_url = formData.get("link_url") as string
    const start_date = formData.get("start_date") as string
    const end_date = formData.get("end_date") as string
    const placement = formData.get("placement") as string
    const active = formData.get("active") === "on"

    // Validate required fields
    if (!title || !description || !image_url || !link_url || !start_date || !end_date || !placement) {
      return { success: false, error: "All fields are required" }
    }

    // Insert ad into database
    const { data, error } = await supabase
      .from("ads")
      .insert([
        {
          title,
          description,
          image_url,
          link_url,
          start_date,
          end_date,
          placement,
          active,
        },
      ])
      .select()

    if (error) {
      throw error
    }

    // Revalidate relevant paths
    revalidatePath("/admin")
    revalidatePath("/")

    return { success: true, ad: data[0] }
  } catch (error) {
    console.error("Error creating ad:", error)
    return { success: false, error: "Failed to create ad" }
  }
}

// Update ad
export async function updateAd(id: string, formData: FormData) {
  const supabase = createServerClient()

  try {
    // Check if user is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Extract ad data from form
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const image_url = formData.get("image_url") as string
    const link_url = formData.get("link_url") as string
    const start_date = formData.get("start_date") as string
    const end_date = formData.get("end_date") as string
    const placement = formData.get("placement") as string
    const active = formData.get("active") === "on"

    // Validate required fields
    if (!title || !description || !image_url || !link_url || !start_date || !end_date || !placement) {
      return { success: false, error: "All fields are required" }
    }

    // Update ad in database
    const { data, error } = await supabase
      .from("ads")
      .update({
        title,
        description,
        image_url,
        link_url,
        start_date,
        end_date,
        placement,
        active,
      })
      .eq("id", id)
      .select()

    if (error) {
      throw error
    }

    // Revalidate relevant paths
    revalidatePath("/admin")
    revalidatePath("/")

    return { success: true, ad: data[0] }
  } catch (error) {
    console.error(`Error updating ad with ID ${id}:`, error)
    return { success: false, error: "Failed to update ad" }
  }
}

// Delete ad
export async function deleteAd(id: string) {
  const supabase = createServerClient()

  try {
    // Check if user is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Delete the ad
    const { error } = await supabase.from("ads").delete().eq("id", id)

    if (error) {
      throw error
    }

    // Revalidate relevant paths
    revalidatePath("/admin")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error(`Error deleting ad with ID ${id}:`, error)
    return { success: false, error: "Failed to delete ad" }
  }
}

// Get active ads by placement
export async function getActiveAdsByPlacement(placement: string) {
  const supabase = createServerClient()

  try {
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("ads")
      .select("*")
      .eq("placement", placement)
      .eq("active", true)
      .lte("start_date", now)
      .gte("end_date", now)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      throw error
    }

    return { success: true, ad: data && data.length > 0 ? data[0] : null }
  } catch (error) {
    console.error(`Error fetching active ads for placement ${placement}:`, error)
    return { success: false, ad: null, error: "Failed to fetch ads" }
  }
}

// Upload file to Supabase storage
export async function uploadFile(file: File, path: string) {
  const supabase = createServerClient()

  try {
    // Check if user is an admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized: Admin access required" }
    }

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage.from("tucheki").upload(path, fileBuffer, {
      contentType: file.type,
      upsert: true,
    })

    if (error) {
      throw error
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("tucheki").getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Error uploading file:", error)
    return { success: false, error: "Failed to upload file" }
  }
}
