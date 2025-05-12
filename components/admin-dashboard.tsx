"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  Film,
  Eye,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Tag,
  Award,
  LogOut,
  Plus,
  Search,
  Filter,
  DollarSign,
} from "lucide-react"
import {
  getTrailers,
  getAds,
  createTrailer,
  updateTrailer,
  deleteTrailer,
  createAd,
  updateAd,
  deleteAd,
  uploadFile,
  adminLogout,
} from "@/app/actions"

// Types
type Trailer = {
  id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  category: string
  release_date: string
  director: string
  cast: string
  duration: string
  featured: boolean
  created_at: string
  views: number
  likes: number
  comments: number
}

type Ad = {
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

export default function AdminDashboard() {
  // State for tabs
  const [activeTab, setActiveTab] = useState("overview")

  // State for data
  const [trailers, setTrailers] = useState<Trailer[]>([])
  const [ads, setAds] = useState<Ad[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // State for loading
  const [isLoading, setIsLoading] = useState(true)

  // State for forms
  const [newTrailer, setNewTrailer] = useState({
    title: "",
    description: "",
    video_url: "",
    thumbnail_url: "",
    category: "",
    release_date: "",
    director: "",
    cast: "",
    duration: "",
    featured: false,
  })

  const [newAd, setNewAd] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    start_date: "",
    end_date: "",
    placement: "home",
    active: true,
  })

  const [editingTrailerId, setEditingTrailerId] = useState<string | null>(null)
  const [editingAdId, setEditingAdId] = useState<string | null>(null)

  // State for file uploads
  const [trailerThumbnailFile, setTrailerThumbnailFile] = useState<File | null>(null)
  const [adImageFile, setAdImageFile] = useState<File | null>(null)

  const router = useRouter()
  const { toast } = useToast()

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      try {
        // Fetch trailers
        const { success: trailerSuccess, trailers: trailerData } = await getTrailers()
        if (trailerSuccess) {
          setTrailers(trailerData)
        } else {
          toast({
            title: "Error",
            description: "Failed to load trailers. Please try again.",
            variant: "destructive",
          })
        }

        // Fetch ads
        const { success: adSuccess, ads: adData } = await getAds()
        if (adSuccess) {
          setAds(adData)
        } else {
          toast({
            title: "Error",
            description: "Failed to load ads. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching admin data:", error)
        toast({
          title: "Error",
          description: "Failed to load admin data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Handle trailer form submission
  const handleTrailerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let thumbnailUrl = newTrailer.thumbnail_url

      // Upload thumbnail if provided
      if (trailerThumbnailFile) {
        const fileName = `trailers/${Date.now()}-${trailerThumbnailFile.name}`
        const { success, url } = await uploadFile(trailerThumbnailFile, fileName)

        if (success && url) {
          thumbnailUrl = url
        } else {
          throw new Error("Failed to upload thumbnail")
        }
      }

      const formData = new FormData()
      formData.append("title", newTrailer.title)
      formData.append("description", newTrailer.description)
      formData.append("video_url", newTrailer.video_url)
      formData.append("thumbnail_url", thumbnailUrl)
      formData.append("category", newTrailer.category)
      formData.append("release_date", newTrailer.release_date)
      formData.append("director", newTrailer.director)
      formData.append("cast", newTrailer.cast)
      formData.append("duration", newTrailer.duration)
      formData.append("featured", newTrailer.featured ? "on" : "off")

      if (editingTrailerId) {
        // Update existing trailer
        const { success } = await updateTrailer(editingTrailerId, formData)

        if (success) {
          toast({
            title: "Success",
            description: "Trailer updated successfully",
          })

          // Refresh trailers
          const { trailers: updatedTrailers } = await getTrailers()
          setTrailers(updatedTrailers)

          // Reset form
          setNewTrailer({
            title: "",
            description: "",
            video_url: "",
            thumbnail_url: "",
            category: "",
            release_date: "",
            director: "",
            cast: "",
            duration: "",
            featured: false,
          })
          setEditingTrailerId(null)
          setTrailerThumbnailFile(null)
        } else {
          throw new Error("Failed to update trailer")
        }
      } else {
        // Create new trailer
        const { success } = await createTrailer(formData)

        if (success) {
          toast({
            title: "Success",
            description: "Trailer created successfully",
          })

          // Refresh trailers
          const { trailers: updatedTrailers } = await getTrailers()
          setTrailers(updatedTrailers)

          // Reset form
          setNewTrailer({
            title: "",
            description: "",
            video_url: "",
            thumbnail_url: "",
            category: "",
            release_date: "",
            director: "",
            cast: "",
            duration: "",
            featured: false,
          })
          setTrailerThumbnailFile(null)
        } else {
          throw new Error("Failed to create trailer")
        }
      }
    } catch (error) {
      console.error("Error submitting trailer:", error)
      toast({
        title: "Error",
        description: "Failed to save trailer. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle ad form submission
  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let imageUrl = newAd.image_url

      // Upload image if provided
      if (adImageFile) {
        const fileName = `ads/${Date.now()}-${adImageFile.name}`
        const { success, url } = await uploadFile(adImageFile, fileName)

        if (success && url) {
          imageUrl = url
        } else {
          throw new Error("Failed to upload ad image")
        }
      }

      const formData = new FormData()
      formData.append("title", newAd.title)
      formData.append("description", newAd.description)
      formData.append("image_url", imageUrl)
      formData.append("link_url", newAd.link_url)
      formData.append("start_date", newAd.start_date)
      formData.append("end_date", newAd.end_date)
      formData.append("placement", newAd.placement)
      formData.append("active", newAd.active ? "on" : "off")

      if (editingAdId) {
        // Update existing ad
        const { success } = await updateAd(editingAdId, formData)

        if (success) {
          toast({
            title: "Success",
            description: "Ad updated successfully",
          })

          // Refresh ads
          const { ads: updatedAds } = await getAds()
          setAds(updatedAds)

          // Reset form
          setNewAd({
            title: "",
            description: "",
            image_url: "",
            link_url: "",
            start_date: "",
            end_date: "",
            placement: "home",
            active: true,
          })
          setEditingAdId(null)
          setAdImageFile(null)
        } else {
          throw new Error("Failed to update ad")
        }
      } else {
        // Create new ad
        const { success } = await createAd(formData)

        if (success) {
          toast({
            title: "Success",
            description: "Ad created successfully",
          })

          // Refresh ads
          const { ads: updatedAds } = await getAds()
          setAds(updatedAds)

          // Reset form
          setNewAd({
            title: "",
            description: "",
            image_url: "",
            link_url: "",
            start_date: "",
            end_date: "",
            placement: "home",
            active: true,
          })
          setAdImageFile(null)
        } else {
          throw new Error("Failed to create ad")
        }
      }
    } catch (error) {
      console.error("Error submitting ad:", error)
      toast({
        title: "Error",
        description: "Failed to save ad. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle trailer edit
  const handleEditTrailer = (trailer: Trailer) => {
    setNewTrailer({
      title: trailer.title,
      description: trailer.description,
      video_url: trailer.video_url,
      thumbnail_url: trailer.thumbnail_url || "",
      category: trailer.category,
      release_date: trailer.release_date,
      director: trailer.director || "",
      cast: trailer.cast || "",
      duration: trailer.duration || "",
      featured: trailer.featured || false,
    })
    setEditingTrailerId(trailer.id)
    setActiveTab("trailers")
  }

  // Handle ad edit
  const handleEditAd = (ad: Ad) => {
    setNewAd({
      title: ad.title,
      description: ad.description,
      image_url: ad.image_url,
      link_url: ad.link_url,
      start_date: ad.start_date,
      end_date: ad.end_date,
      placement: ad.placement,
      active: ad.active,
    })
    setEditingAdId(ad.id)
    setActiveTab("ads")
  }

  // Handle trailer delete
  const handleDeleteTrailer = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this trailer? This action cannot be undone.")) {
      try {
        const { success } = await deleteTrailer(id)

        if (success) {
          toast({
            title: "Success",
            description: "Trailer deleted successfully",
          })

          // Remove from state
          setTrailers(trailers.filter((trailer) => trailer.id !== id))
        } else {
          throw new Error("Failed to delete trailer")
        }
      } catch (error) {
        console.error("Error deleting trailer:", error)
        toast({
          title: "Error",
          description: "Failed to delete trailer. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Handle ad delete
  const handleDeleteAd = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this ad? This action cannot be undone.")) {
      try {
        const { success } = await deleteAd(id)

        if (success) {
          toast({
            title: "Success",
            description: "Ad deleted successfully",
          })

          // Remove from state
          setAds(ads.filter((ad) => ad.id !== id))
        } else {
          throw new Error("Failed to delete ad")
        }
      } catch (error) {
        console.error("Error deleting ad:", error)
        toast({
          title: "Error",
          description: "Failed to delete ad. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      const { success } = await adminLogout()

      if (success) {
        toast({
          title: "Logged out",
          description: "You have been logged out successfully",
        })
        router.push("/admin/login")
      } else {
        throw new Error("Failed to logout")
      }
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Filter trailers based on search query
  const filteredTrailers = trailers.filter(
    (trailer) =>
      trailer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trailer.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Filter ads based on search query
  const filteredAds = ads.filter(
    (ad) =>
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.placement.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A0F07] to-[#2A1A10] text-amber-100">
      <header className="bg-amber-950/50 border-b border-amber-900/50 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Film className="h-6 w-6 text-amber-500" />
            <h1 className="text-xl font-bold text-amber-400">Tucheki Admin</h1>
          </div>
          <Button variant="ghost" className="text-amber-400 hover:bg-amber-900/30" onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-amber-950/50 border-amber-900/50">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-amber-900/50 data-[state=active]:text-amber-300"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="trailers"
              className="data-[state=active]:bg-amber-900/50 data-[state=active]:text-amber-300"
            >
              Trailers
            </TabsTrigger>
            <TabsTrigger value="ads" className="data-[state=active]:bg-amber-900/50 data-[state=active]:text-amber-300">
              Ads
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-amber-950/30 border-amber-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-amber-300">Total Trailers</CardTitle>
                  <Film className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 bg-amber-900/30" />
                  ) : (
                    <div className="text-2xl font-bold text-amber-100">{trailers.length}</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-amber-950/30 border-amber-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-amber-300">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 bg-amber-900/30" />
                  ) : (
                    <div className="text-2xl font-bold text-amber-100">
                      {trailers.reduce((sum, trailer) => sum + (trailer.views || 0), 0).toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-amber-950/30 border-amber-900/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-amber-300">Active Ads</CardTitle>
                  <DollarSign className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 bg-amber-900/30" />
                  ) : (
                    <div className="text-2xl font-bold text-amber-100">{ads.filter((ad) => ad.active).length}</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-amber-950/30 border-amber-900/50">
              <CardHeader>
                <CardTitle className="text-amber-400">Recent Trailers</CardTitle>
                <CardDescription className="text-amber-300/70">Recently added trailers</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                  </div>
                ) : trailers.length > 0 ? (
                  <div className="space-y-4">
                    {trailers.slice(0, 5).map((trailer) => (
                      <div
                        key={trailer.id}
                        className="flex items-center justify-between p-4 border border-amber-900/30 rounded-md bg-amber-950/20"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-amber-900/20">
                            <img
                              src={trailer.thumbnail_url || "/placeholder.svg?height=48&width=48"}
                              alt={trailer.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-amber-200">{trailer.title}</h4>
                            <p className="text-sm text-amber-300/70">{trailer.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-amber-400 hover:bg-amber-900/30"
                            onClick={() => handleEditTrailer(trailer)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-amber-400 hover:bg-amber-900/30"
                            onClick={() => handleDeleteTrailer(trailer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-amber-300/70 py-8">No trailers available</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-amber-950/30 border-amber-900/50">
              <CardHeader>
                <CardTitle className="text-amber-400">Active Ads</CardTitle>
                <CardDescription className="text-amber-300/70">Currently active advertisements</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                  </div>
                ) : ads.filter((ad) => ad.active).length > 0 ? (
                  <div className="space-y-4">
                    {ads
                      .filter((ad) => ad.active)
                      .slice(0, 3)
                      .map((ad) => (
                        <div
                          key={ad.id}
                          className="flex items-center justify-between p-4 border border-amber-900/30 rounded-md bg-amber-950/20"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-amber-900/20">
                              <img
                                src={ad.image_url || "/placeholder.svg?height=48&width=48"}
                                alt={ad.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-medium text-amber-200">{ad.title}</h4>
                              <p className="text-sm text-amber-300/70">{ad.placement}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-amber-400 hover:bg-amber-900/30"
                              onClick={() => handleEditAd(ad)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-amber-400 hover:bg-amber-900/30"
                              onClick={() => handleDeleteAd(ad.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-amber-300/70 py-8">No active ads available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trailers Tab */}
          <TabsContent value="trailers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-amber-400">Manage Trailers</h2>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => {
                  setNewTrailer({
                    title: "",
                    description: "",
                    video_url: "",
                    thumbnail_url: "",
                    category: "",
                    release_date: "",
                    director: "",
                    cast: "",
                    duration: "",
                    featured: false,
                  })
                  setEditingTrailerId(null)
                  setTrailerThumbnailFile(null)
                  document.getElementById("trailerForm")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Trailer
              </Button>
            </div>

            <div className="mb-6 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 h-5 w-5" />
                <Input
                  placeholder="Search trailers..."
                  className="pl-10 bg-amber-950/50 border-amber-800/50 text-amber-100 placeholder:text-amber-400/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="border-amber-700/50 text-amber-400 hover:bg-amber-900/30">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <Card className="bg-amber-950/30 border-amber-900/50" id="trailerForm">
              <CardHeader>
                <CardTitle className="text-amber-400">
                  {editingTrailerId ? "Edit Trailer" : "Add New Trailer"}
                </CardTitle>
                <CardDescription className="text-amber-300/70">
                  {editingTrailerId ? "Update trailer information" : "Add a new trailer to the platform"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrailerSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-amber-300">
                        Title
                      </Label>
                      <Input
                        id="title"
                        value={newTrailer.title}
                        onChange={(e) => setNewTrailer({ ...newTrailer, title: e.target.value })}
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-amber-300">
                        Category
                      </Label>
                      <Select
                        value={newTrailer.category}
                        onValueChange={(value) => setNewTrailer({ ...newTrailer, category: value })}
                        required
                      >
                        <SelectTrigger id="category" className="bg-amber-950/50 border-amber-800/50 text-amber-100">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-amber-950 border-amber-900/50">
                          <SelectItem value="action">Action</SelectItem>
                          <SelectItem value="comedy">Comedy</SelectItem>
                          <SelectItem value="drama">Drama</SelectItem>
                          <SelectItem value="documentary">Documentary</SelectItem>
                          <SelectItem value="thriller">Thriller</SelectItem>
                          <SelectItem value="romance">Romance</SelectItem>
                          <SelectItem value="horror">Horror</SelectItem>
                          <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                          <SelectItem value="animation">Animation</SelectItem>
                          <SelectItem value="adventure">Adventure</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-amber-300">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newTrailer.description}
                      onChange={(e) => setNewTrailer({ ...newTrailer, description: e.target.value })}
                      rows={4}
                      className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="video_url" className="text-amber-300">
                        Video URL
                      </Label>
                      <Input
                        id="video_url"
                        value={newTrailer.video_url}
                        onChange={(e) => setNewTrailer({ ...newTrailer, video_url: e.target.value })}
                        placeholder="YouTube or direct video URL"
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100 placeholder:text-amber-400/50"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="thumbnail_url" className="text-amber-300">
                        Thumbnail URL
                      </Label>
                      <Input
                        id="thumbnail_url"
                        value={newTrailer.thumbnail_url}
                        onChange={(e) => setNewTrailer({ ...newTrailer, thumbnail_url: e.target.value })}
                        placeholder="Leave empty to upload a file"
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100 placeholder:text-amber-400/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail_file" className="text-amber-300">
                      Upload Thumbnail
                    </Label>
                    <Input
                      id="thumbnail_file"
                      type="file"
                      accept="image/*"
                      className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setTrailerThumbnailFile(e.target.files[0])
                        }
                      }}
                    />
                    {trailerThumbnailFile && (
                      <p className="text-sm text-amber-300/70">Selected file: {trailerThumbnailFile.name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="release_date" className="text-amber-300">
                        Release Date
                      </Label>
                      <Input
                        id="release_date"
                        type="date"
                        value={newTrailer.release_date}
                        onChange={(e) => setNewTrailer({ ...newTrailer, release_date: e.target.value })}
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="director" className="text-amber-300">
                        Director
                      </Label>
                      <Input
                        id="director"
                        value={newTrailer.director}
                        onChange={(e) => setNewTrailer({ ...newTrailer, director: e.target.value })}
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-amber-300">
                        Duration
                      </Label>
                      <Input
                        id="duration"
                        value={newTrailer.duration}
                        onChange={(e) => setNewTrailer({ ...newTrailer, duration: e.target.value })}
                        placeholder="e.g. 2:30"
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100 placeholder:text-amber-400/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cast" className="text-amber-300">
                      Cast
                    </Label>
                    <Input
                      id="cast"
                      value={newTrailer.cast}
                      onChange={(e) => setNewTrailer({ ...newTrailer, cast: e.target.value })}
                      placeholder="Comma separated list of actors"
                      className="bg-amber-950/50 border-amber-800/50 text-amber-100 placeholder:text-amber-400/50"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      checked={newTrailer.featured}
                      onCheckedChange={(checked) => setNewTrailer({ ...newTrailer, featured: checked })}
                    />
                    <Label htmlFor="featured" className="text-amber-300">
                      Featured Trailer
                    </Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    {editingTrailerId && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-amber-700/50 text-amber-400 hover:bg-amber-900/30"
                        onClick={() => {
                          setNewTrailer({
                            title: "",
                            description: "",
                            video_url: "",
                            thumbnail_url: "",
                            category: "",
                            release_date: "",
                            director: "",
                            cast: "",
                            duration: "",
                            featured: false,
                          })
                          setEditingTrailerId(null)
                          setTrailerThumbnailFile(null)
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                      {editingTrailerId ? "Update Trailer" : "Add Trailer"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-amber-950/30 border-amber-900/50">
              <CardHeader>
                <CardTitle className="text-amber-400">All Trailers</CardTitle>
                <CardDescription className="text-amber-300/70">
                  {filteredTrailers.length} trailers found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                  </div>
                ) : filteredTrailers.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTrailers.map((trailer) => (
                      <div
                        key={trailer.id}
                        className="flex items-center justify-between p-4 border border-amber-900/30 rounded-md bg-amber-950/20"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-9 rounded-md overflow-hidden bg-amber-900/20">
                            <img
                              src={trailer.thumbnail_url || "/placeholder.svg?height=36&width=64"}
                              alt={trailer.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-amber-200">{trailer.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-amber-300/70">
                              <span className="flex items-center">
                                <Tag className="h-3 w-3 mr-1" />
                                {trailer.category}
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(trailer.release_date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {trailer.duration}
                              </span>
                              <span className="flex items-center">
                                <Eye className="h-3 w-3 mr-1" />
                                {trailer.views || 0}
                              </span>
                              {trailer.featured && (
                                <span className="flex items-center text-amber-500">
                                  <Award className="h-3 w-3 mr-1" />
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-700/50 text-amber-400 hover:bg-amber-900/30"
                            onClick={() => handleEditTrailer(trailer)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-700/50 text-amber-400 hover:bg-amber-900/30"
                            onClick={() => handleDeleteTrailer(trailer.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-amber-300/70 py-8">
                    {searchQuery ? `No trailers found matching "${searchQuery}"` : "No trailers available"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Tab */}
          <TabsContent value="ads" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-amber-400">Manage Ads</h2>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => {
                  setNewAd({
                    title: "",
                    description: "",
                    image_url: "",
                    link_url: "",
                    start_date: "",
                    end_date: "",
                    placement: "home",
                    active: true,
                  })
                  setEditingAdId(null)
                  setAdImageFile(null)
                  document.getElementById("adForm")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Ad
              </Button>
            </div>

            <div className="mb-6 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 h-5 w-5" />
                <Input
                  placeholder="Search ads..."
                  className="pl-10 bg-amber-950/50 border-amber-800/50 text-amber-100 placeholder:text-amber-400/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="border-amber-700/50 text-amber-400 hover:bg-amber-900/30">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <Card className="bg-amber-950/30 border-amber-900/50" id="adForm">
              <CardHeader>
                <CardTitle className="text-amber-400">{editingAdId ? "Edit Ad" : "Add New Ad"}</CardTitle>
                <CardDescription className="text-amber-300/70">
                  {editingAdId ? "Update ad information" : "Add a new advertisement to the platform"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad_title" className="text-amber-300">
                        Title
                      </Label>
                      <Input
                        id="ad_title"
                        value={newAd.title}
                        onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ad_placement" className="text-amber-300">
                        Placement
                      </Label>
                      <Select
                        value={newAd.placement}
                        onValueChange={(value) => setNewAd({ ...newAd, placement: value })}
                        required
                      >
                        <SelectTrigger id="ad_placement" className="bg-amber-950/50 border-amber-800/50 text-amber-100">
                          <SelectValue placeholder="Select placement" />
                        </SelectTrigger>
                        <SelectContent className="bg-amber-950 border-amber-900/50">
                          <SelectItem value="home">Home Page</SelectItem>
                          <SelectItem value="trailers">Trailers Page</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                          <SelectItem value="player">Video Player</SelectItem>
                          <SelectItem value="banner">Banner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ad_description" className="text-amber-300">
                      Description
                    </Label>
                    <Textarea
                      id="ad_description"
                      value={newAd.description}
                      onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                      rows={3}
                      className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad_image_url" className="text-amber-300">
                        Image URL
                      </Label>
                      <Input
                        id="ad_image_url"
                        value={newAd.image_url}
                        onChange={(e) => setNewAd({ ...newAd, image_url: e.target.value })}
                        placeholder="Leave empty to upload a file"
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100 placeholder:text-amber-400/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ad_link_url" className="text-amber-300">
                        Link URL
                      </Label>
                      <Input
                        id="ad_link_url"
                        value={newAd.link_url}
                        onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })}
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ad_image_file" className="text-amber-300">
                      Upload Image
                    </Label>
                    <Input
                      id="ad_image_file"
                      type="file"
                      accept="image/*"
                      className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAdImageFile(e.target.files[0])
                        }
                      }}
                    />
                    {adImageFile && <p className="text-sm text-amber-300/70">Selected file: {adImageFile.name}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad_start_date" className="text-amber-300">
                        Start Date
                      </Label>
                      <Input
                        id="ad_start_date"
                        type="date"
                        value={newAd.start_date}
                        onChange={(e) => setNewAd({ ...newAd, start_date: e.target.value })}
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ad_end_date" className="text-amber-300">
                        End Date
                      </Label>
                      <Input
                        id="ad_end_date"
                        type="date"
                        value={newAd.end_date}
                        onChange={(e) => setNewAd({ ...newAd, end_date: e.target.value })}
                        className="bg-amber-950/50 border-amber-800/50 text-amber-100"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ad_active"
                      checked={newAd.active}
                      onCheckedChange={(checked) => setNewAd({ ...newAd, active: checked })}
                    />
                    <Label htmlFor="ad_active" className="text-amber-300">
                      Active
                    </Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    {editingAdId && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-amber-700/50 text-amber-400 hover:bg-amber-900/30"
                        onClick={() => {
                          setNewAd({
                            title: "",
                            description: "",
                            image_url: "",
                            link_url: "",
                            start_date: "",
                            end_date: "",
                            placement: "home",
                            active: true,
                          })
                          setEditingAdId(null)
                          setAdImageFile(null)
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                      {editingAdId ? "Update Ad" : "Add Ad"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-amber-950/30 border-amber-900/50">
              <CardHeader>
                <CardTitle className="text-amber-400">All Ads</CardTitle>
                <CardDescription className="text-amber-300/70">{filteredAds.length} ads found</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                    <Skeleton className="h-12 w-full bg-amber-900/30" />
                  </div>
                ) : filteredAds.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAds.map((ad) => (
                      <div
                        key={ad.id}
                        className="flex items-center justify-between p-4 border border-amber-900/30 rounded-md bg-amber-950/20"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-9 rounded-md overflow-hidden bg-amber-900/20">
                            <img
                              src={ad.image_url || "/placeholder.svg?height=36&width=64"}
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-amber-200">{ad.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-amber-300/70">
                              <span>{ad.placement}</span>
                              <span>
                                {new Date(ad.start_date).toLocaleDateString()} -{" "}
                                {new Date(ad.end_date).toLocaleDateString()}
                              </span>
                              <span className={ad.active ? "text-green-500" : "text-red-500"}>
                                {ad.active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-700/50 text-amber-400 hover:bg-amber-900/30"
                            onClick={() => handleEditAd(ad)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-700/50 text-amber-400 hover:bg-amber-900/30"
                            onClick={() => handleDeleteAd(ad.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-amber-300/70 py-8">
                    {searchQuery ? `No ads found matching "${searchQuery}"` : "No ads available"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
