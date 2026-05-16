import { useEffect, useRef, useState } from "react";
import { CameraIcon, UploadIcon } from "../icons";
import { Modal } from "../Modal";

type ScanMealModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ScanMealModal({ open, onClose }: ScanMealModalProps) {
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setPreviewUrl(null);
      setCameraError(null);
      setCameraOpen(false);
    }

    return () => stopCamera();
  }, [open]);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  async function startCamera() {
    setCameraError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      setCameraError("Camera is not available. You can still upload from library.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setCameraOpen(false);
    stopCamera();
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(blob);
      });
      setCameraOpen(false);
      stopCamera();
    }, "image/jpeg");
  }

  return (
    <Modal open={open} onClose={onClose} title="Scan meal">
      <div className="space-y-5">
        <p className="text-sm text-slate-500">
          Choose a meal photo from your library or take a new picture now.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => libraryInputRef.current?.click()}
            className="flex min-h-28 touch-manipulation flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-blue-300 hover:bg-blue-50/50"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UploadIcon />
            </span>
            <span className="text-sm font-semibold text-slate-900">Choose from library</span>
            <span className="text-xs text-slate-500">Photos from phone or computer</span>
          </button>

          <button
            type="button"
            onClick={startCamera}
            className="flex min-h-28 touch-manipulation flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center transition hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <CameraIcon />
            </span>
            <span className="text-sm font-semibold text-slate-900">Take a picture now</span>
            <span className="text-xs text-slate-500">Camera on mobile or desktop</span>
          </button>
        </div>

        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {cameraError && <p className="text-sm text-amber-700">{cameraError}</p>}

        {cameraOpen && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-video w-full rounded-xl bg-slate-900 object-cover"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCameraOpen(false);
                  stopCamera();
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Cancel camera
              </button>
              <button
                type="button"
                onClick={captureFrame}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Capture photo
              </button>
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <img
              src={previewUrl}
              alt="Selected meal preview"
              className="max-h-72 w-full rounded-xl object-cover"
            />
            <button
              type="button"
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Continue to scan
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
