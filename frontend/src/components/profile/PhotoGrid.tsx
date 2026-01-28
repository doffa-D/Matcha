import { useRef, useState } from "react";
import { Camera, X, Plus, Star, Loader2, AlertCircle, RotateCw, Crop, Palette } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadImages, deleteImage, setProfileImage } from "@/api/profile";
import { useAuth } from "@/context";

// Image upload validation constants
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;

interface PhotoSlot {
  id: number | null;
  url: string | null;
  isProfilePic: boolean;
}

interface PhotoGridProps {
  photos: PhotoSlot[];
  isEditing: boolean;
  currentImageCount: number;
}

// Validate image file
const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Invalid file type. Allowed: JPG, PNG, GIF, WebP`;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return `File too large. Maximum size: 5MB`;
  }
  return null;
};

export function PhotoGrid({ photos, isEditing, currentImageCount }: PhotoGridProps) {
  const { refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [filter, setFilter] = useState<string>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Image upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const response = await uploadImages(file);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      refreshProfile(); // Update auth context
      setImageError(null);
    },
    onError: (error: any) => {
      const message =
        error?.data?.error || error?.message || "Failed to upload image";
      setImageError(message);
    },
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await deleteImage(imageId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      refreshProfile(); // Update auth context
      setImageError(null);
    },
    onError: (error: any) => {
      const message =
        error?.data?.error || error?.message || "Failed to delete image";
      setImageError(message);
    },
  });

  // Set profile image mutation
  const setProfileMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const response = await setProfileImage(imageId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      refreshProfile(); // Update auth context
      setImageError(null);
    },
    onError: (error: any) => {
      const message =
        error?.data?.error || error?.message || "Failed to set profile image";
      setImageError(message);
    },
  });

  // Handle clicking on a photo slot to upload
  const handlePhotoUpload = () => {
    if (currentImageCount >= MAX_IMAGES) {
      setImageError(
        `Maximum ${MAX_IMAGES} images allowed. Delete an image first.`,
      );
      return;
    }

    setImageError(null);
    fileInputRef.current?.click();
  };

  // Handle file selection from file picker
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    processFile(file);

    // Reset file input for future uploads
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Process and validate file
  const processFile = (file: File) => {
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }

    // Open image editor
    const reader = new FileReader();
    reader.onload = (e) => {
      setEditingImage(e.target?.result as string);
      setRotation(0);
      setFilter('none');
    };
    reader.readAsDataURL(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEditing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!isEditing) return;

    if (currentImageCount >= MAX_IMAGES) {
      setImageError(
        `Maximum ${MAX_IMAGES} images allowed. Delete an image first.`,
      );
      return;
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Apply edits and upload
  const handleSaveEdit = async () => {
    if (!editingImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a new image to apply transformations
    const img = new Image();
    img.onload = () => {
      // Calculate canvas size based on rotation
      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply filter
      ctx.filter = filter !== 'none' ? filter : 'none';

      // Apply rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Convert to blob and upload
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'edited-image.jpg', { type: 'image/jpeg' });
          uploadMutation.mutate(file);
          setEditingImage(null);
          setRotation(0);
          setFilter('none');
        }
      }, 'image/jpeg', 0.9);
    };
    img.src = editingImage;
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingImage(null);
    setRotation(0);
    setFilter('none');
  };

  // Handle photo deletion
  const handlePhotoRemove = (photoId: number) => {
    // Confirm deletion
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    setImageError(null);
    deleteMutation.mutate(photoId);
  };

  // Handle setting a photo as profile picture
  const handleSetProfilePhoto = (photoId: number) => {
    setImageError(null);
    setProfileMutation.mutate(photoId);
  };

  return (
    <>
    <section 
      className={`bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 transition-all ${
        isDragging ? 'ring-2 ring-matcha border-matcha bg-matcha-light/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
        <Camera className="w-4 h-4" />
        Photos ({photos.filter((p) => p.url).length}/{MAX_IMAGES})
      </h2>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message */}
      {imageError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{imageError}</span>
          <button
            onClick={() => setImageError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global upload indicator */}
      {uploadMutation.isPending && (
        <div className="mb-4 p-3 bg-matcha-light border border-matcha/30 rounded-xl flex items-center gap-3 text-sm text-matcha-dark">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading image...</span>
        </div>
      )}

      <div className="grid grid-cols-5 gap-3">
        {photos.map((photo, index) => {
          const isDeleting =
            deleteMutation.isPending &&
            deleteMutation.variables === photo.id;
          const isSettingProfile =
            setProfileMutation.isPending &&
            setProfileMutation.variables === photo.id;
          const isProcessing = isDeleting || isSettingProfile;

          return (
            <div
              key={index}
              className={`
                relative aspect-square rounded-xl overflow-hidden border-2 transition-all
                ${
                  photo.isProfilePic && photo.url
                    ? "ring-2 ring-matcha ring-offset-2 border-matcha"
                    : "border-neutral-200"
                }
                ${!photo.url ? "bg-neutral-100" : ""}
              `}
            >
              {/* Loading overlay for delete/set-profile */}
              {isProcessing && (
                <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}

              {photo.url ? (
                <>
                  <img
                    src={photo.url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {photo.isProfilePic && (
                    <div className="absolute top-1 left-1 bg-matcha text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      Profile
                    </div>
                  )}
                  {isEditing && !isProcessing && photo.id && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!photo.isProfilePic && (
                        <button
                          onClick={() =>
                            handleSetProfilePhoto(photo.id!)
                          }
                          className="p-1.5 bg-white rounded-full hover:bg-matcha-light transition-colors"
                          title="Set as profile photo"
                        >
                          <Star className="w-3.5 h-3.5 text-neutral-700" />
                        </button>
                      )}
                      <button
                        onClick={() => handlePhotoRemove(photo.id!)}
                        className="p-1.5 bg-white rounded-full hover:bg-red-100 transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  )}
                </>
              ) : isEditing ? (
                <button
                  onClick={handlePhotoUpload}
                  disabled={uploadMutation.isPending}
                  className="w-full h-full flex flex-col items-center justify-center text-neutral-400 hover:text-matcha hover:bg-matcha-light/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin text-matcha" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span className="text-[10px] mt-1">Add</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <Camera className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isEditing && (
        <p className="text-xs text-neutral-400 mt-3">
          {isDragging ? (
            <span className="text-matcha font-medium">Drop image here to upload</span>
          ) : (
            <span>Drag & drop or click to add. Click star to set profile picture. Max 5MB (JPG, PNG, GIF, WebP).</span>
          )}
        </p>
      )}
    </section>

    {/* Image Editor Modal */}
    {editingImage && (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h3 className="font-bold text-lg">Edit Image</h3>
            <button
              onClick={handleCancelEdit}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Image Preview */}
          <div className="flex-1 overflow-auto p-6 bg-neutral-50 flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full hidden"
            />
            <img
              src={editingImage}
              alt="Preview"
              className="max-w-full max-h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                filter: filter !== 'none' ? filter : 'none',
              }}
            />
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-neutral-200 space-y-4">
            {/* Rotation */}
            <div className="flex items-center gap-3">
              <RotateCw className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700 w-20">Rotate:</span>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm transition-colors"
              >
                90°
              </button>
              <span className="text-sm text-neutral-500">{rotation}°</span>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700 w-20">Filter:</span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { name: 'None', value: 'none' },
                  { name: 'Grayscale', value: 'grayscale(100%)' },
                  { name: 'Sepia', value: 'sepia(100%)' },
                  { name: 'Bright', value: 'brightness(1.2)' },
                  { name: 'Contrast', value: 'contrast(1.3)' },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      filter === f.value
                        ? 'bg-matcha text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={uploadMutation.isPending}
                className="px-4 py-2 bg-matcha hover:bg-matcha-dark text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
