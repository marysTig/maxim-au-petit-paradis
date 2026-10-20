/**
 * Cloudinary unsigned upload utility
 * Cloud name : dhbme66ii
 * Upload preset (unsigned) : droblow
 */

const CLOUD_NAME = "dhbme66ii";
const UPLOAD_PRESET = "droblow";
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a File/Blob to Cloudinary using an unsigned preset.
 * Returns the full Cloudinary response on success.
 */
export async function uploadToCloudinary(file: File): Promise<CloudinaryResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "maxim-au-petit-paradis");

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ??
        `Cloudinary upload failed (${res.status})`
    );
  }

  return res.json() as Promise<CloudinaryResult>;
}

/**
 * Build an optimised Cloudinary URL with auto format + quality.
 */
export function cloudinaryUrl(
  publicId: string,
  opts: { width?: number; quality?: string } = {}
): string {
  const { width = 600, quality = "auto" } = opts;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_${quality},w_${width}/${publicId}`;
}

/** LocalStorage key used to persist the logo URL across page reloads. */
export const LOGO_STORAGE_KEY = "maxim_logo_url";

export function getSavedLogoUrl(): string | null {
  try {
    return localStorage.getItem(LOGO_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLogoUrl(url: string): void {
  try {
    localStorage.setItem(LOGO_STORAGE_KEY, url);
  } catch {
    // ignore
  }
}
