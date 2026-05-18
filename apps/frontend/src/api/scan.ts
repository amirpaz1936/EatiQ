import { apiRequest } from "./client";

export type NutritionTotals = {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
};

export type AnalysisItem = {
  name: string;
  estimatedWeightGrams: number;
  relativeAreaPercent: number;
  confidence: number;
  nutrition: NutritionTotals;
};

export type AnalysisResult = {
  language: string;
  imageUrl: string;
  items: AnalysisItem[];
  totals: NutritionTotals;
  notes: string;
};

export type PresignResponse = {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
};

export type UploadContentType = "image/jpeg" | "image/png" | "image/webp";

export function requestUploadPresign(
  contentType: UploadContentType,
): Promise<PresignResponse> {
  return apiRequest<PresignResponse>("/api/uploads/presign", {
    method: "POST",
    body: { contentType },
  });
}

export async function uploadBlobToPresignedUrl(
  uploadUrl: string,
  blob: Blob,
  contentType: UploadContentType,
): Promise<void> {
  // Raw fetch — we must NOT send our JWT to Minio, and the signed URL has its own auth.
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": contentType },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Upload failed: ${response.status} ${response.statusText}${text ? ` — ${text.slice(0, 200)}` : ""}`,
    );
  }
}

export function analyzeUploadedImage(
  objectKey: string,
  language: string,
): Promise<AnalysisResult> {
  return apiRequest<AnalysisResult>("/api/image-recognition", {
    method: "POST",
    body: { objectKey, language },
  });
}
