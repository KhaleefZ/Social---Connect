export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_POST_MEDIA_SIZE_BYTES = 20 * 1024 * 1024;
export const ACCEPTED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const ACCEPTED_POST_MEDIA_MIME_TYPES = ["image/jpeg", "image/png", "video/mp4", "video/webm"] as const;

export type UploadTarget = "avatar" | "post-image";

export function validateImageUpload(file: File, target: UploadTarget) {
  if (!ACCEPTED_IMAGE_MIME_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_MIME_TYPES)[number])) {
    return `${target} uploads must be JPEG or PNG.`;
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `${target} uploads must be smaller than 2 MB.`;
  }

  return null;
}

export function validatePostMediaUpload(file: File) {
  if (!ACCEPTED_POST_MEDIA_MIME_TYPES.includes(file.type as (typeof ACCEPTED_POST_MEDIA_MIME_TYPES)[number])) {
    return "Post media uploads must be JPEG, PNG, MP4, or WebM.";
  }

  if (file.size > MAX_POST_MEDIA_SIZE_BYTES) {
    return "Post media uploads must be smaller than 20 MB. You can upload smaller images or videos.";
  }

  return null;
}

export function createStorageFileName(prefix: string, originalName: string) {
  const extension = originalName.split(".").pop()?.toLowerCase() ?? "bin";

  return `${prefix}/${crypto.randomUUID()}.${extension}`;
}