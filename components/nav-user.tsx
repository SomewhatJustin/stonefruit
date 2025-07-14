"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trpc } from "@/lib/trpcClient"
import { toast } from "sonner"
import { getProfileDisplayName } from "@/lib/utils"
import Cropper from "react-easy-crop"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { signOutAction } from "@/lib/actions"

export function NavUser({
  user,
}: {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    username?: string | null
  }
}) {
  const { isMobile } = useSidebar()
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state for editing
  const [profileImage, setProfileImage] = useState(user.image || "")
  const [fullName, setFullName] = useState(user.name || "")
  const [username, setUsername] = useState(user.username || "")
  const [isUploading, setIsUploading] = useState(false)

  // Cropping state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string>("")
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  // Check if user profile is incomplete and auto-open dialog
  useEffect(() => {
    const isProfileIncomplete = !user.name // || !user.username
    if (isProfileIncomplete) {
      setAccountModalOpen(true)
    }
  }, [user.name]) // , user.username

  // tRPC mutations
  const utils = trpc.useUtils()
  const updateProfile = trpc.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully!")
      // Refresh the page to update the user data in the session
      window.location.reload()
    },
    onError: error => {
      toast.error(error.message || "Failed to update profile")
    },
  })

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  // Helper function to create cropped image
  const createCroppedImage = useCallback(
    async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
      const image = new Image()
      image.src = imageSrc

      return new Promise(resolve => {
        image.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")!

          // Set canvas size to square
          const size = Math.min(pixelCrop.width, pixelCrop.height)
          canvas.width = size
          canvas.height = size

          ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            size,
            size
          )

          canvas.toBlob(
            blob => {
              resolve(blob!)
            },
            "image/jpeg",
            0.8
          )
        }
      })
    },
    []
  )

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      toast.error("Image must be less than 10MB")
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      const imageUrl = data.urls?.[0]

      if (imageUrl) {
        // Open crop modal with the uploaded image
        setImageToCrop(imageUrl)
        setCropModalOpen(true)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload image")
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !imageToCrop) return

    try {
      setIsUploading(true)

      // Create cropped image blob
      const croppedImageBlob = await createCroppedImage(
        imageToCrop,
        croppedAreaPixels
      )

      // Upload the cropped image
      const formData = new FormData()
      formData.append("file", croppedImageBlob, "cropped-profile.jpg")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      const croppedImageUrl = data.urls?.[0]

      if (croppedImageUrl) {
        setProfileImage(croppedImageUrl)
        setCropModalOpen(false)
        toast.success(
          "Image cropped! Click 'Save Changes' to update your profile."
        )
      }
    } catch (error) {
      console.error("Crop upload error:", error)
      toast.error("Failed to process cropped image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveChanges = () => {
    updateProfile.mutate({
      name: fullName,
      username: username.trim() || undefined, // Send undefined if username is empty
      image: profileImage,
    })
  }

  return (
    <>
      <SidebarMenuItem className="rounded-sm mt-auto mb-2 mx-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                {/* <AvatarFallback className="rounded-lg">
                  {user.name?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase() ||
                    "U"}
                </AvatarFallback> */}
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{getProfileDisplayName(user)}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email || ""}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.image || ""} alt={user.name || ""} />
                  {/* <AvatarFallback className="rounded-lg">
                    {user.name?.charAt(0).toUpperCase() ||
                      user.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </AvatarFallback> */}
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {getProfileDisplayName(user)}
                  </span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email || ""}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setAccountModalOpen(true)}>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={e => {
                e.preventDefault()
                signOutAction()
              }}
            >
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <Dialog open={accountModalOpen} onOpenChange={(open) => {
        // Prevent closing if profile is incomplete
        const isProfileIncomplete = !user.name // || !user.username
        if (!open && isProfileIncomplete) {
          return // Don't allow closing
        }
        setAccountModalOpen(open)
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {(!user.name) ? "Complete Your Profile" : "Account Settings"}
            </DialogTitle>
            <DialogDescription>
              {(!user.name) 
                ? "Please complete your profile to get started with Stonefruit."
                : "Manage your account settings and preferences."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Show required fields note for incomplete profiles */}
            {(!user.name) && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <span className="text-red-500">*</span> Required fields
              </div>
            )}
            
            {/* Profile Picture Section */}
            <div className="space-y-2">
              <Label htmlFor="profile-picture">Profile Picture</Label>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profileImage} alt={fullName || "User"} />
                  {/* <AvatarFallback className="text-lg">
                    {fullName?.charAt(0).toUpperCase() ||
                      user.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </AvatarFallback> */}
                </Avatar>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Change Picture"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Full Name Section */}
            <div className="space-y-2">
              <Label htmlFor="full-name">
                Full Name {!user.name && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="full-name"
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className={!user.name && !fullName.trim() ? "border-red-300 focus:border-red-500" : ""}
              />
            </div>

            {/* Username Section - Commented out for now */}
            {/* <div className="space-y-2">
              <Label htmlFor="username">
                Username {!user.username && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className={!user.username && !username.trim() ? "border-red-300 focus:border-red-500" : ""}
              />
            </div> */}

            {/* Email Section (Read-only for now) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed at this time
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            {/* Only show cancel button if profile is complete */}
            {(user.name) && (
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
            )}
            <Button
              onClick={handleSaveChanges}
              disabled={updateProfile.isPending || !fullName.trim()}
            >
              {updateProfile.isPending ? "Saving..." : 
               (!user.name) ? "Complete Profile" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
            <DialogDescription>
              Adjust the crop area to create a square profile picture.
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-96 w-full">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="zoom">Zoom:</Label>
            <input
              id="zoom"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleCropConfirm}
              disabled={isUploading || !croppedAreaPixels}
            >
              {isUploading ? "Processing..." : "Confirm Crop"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
