import { useCallback, useEffect, useRef, useState } from "react";
import { IdentityService } from "@/services/identity.service";
import { ServiceError } from "@/lib/types";

export type NinVerificationPhase =
  | "idle"
  | "camera-loading"
  | "camera-ready"
  | "captured"
  | "submitting"
  | "success"
  | "failed";

const JPEG_DATA_URL_PREFIX = /^data:image\/jpeg;base64,/;

export function useNinVerification(onSuccess?: () => void) {
  const [phase, setPhase] = useState<NinVerificationPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // Release the camera if the user navigates away mid-flow.
  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setPhase("camera-loading");
    setError(null);
    try {
      // Portrait aspect ratio — a selfie is naturally taller than wide,
      // regardless of device. Most cameras honour this as a preference.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", aspectRatio: { ideal: 3 / 4 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("camera-ready");
    } catch {
      setPhase("failed");
      setError("Could not access your camera. Please check permissions and try again.");
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl.replace(JPEG_DATA_URL_PREFIX, ""));
    stopCamera();
    setPhase("captured");
  }, [stopCamera]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const submit = useCallback(
    async (nin: string) => {
      if (!capturedImage) return;

      setPhase("submitting");
      setError(null);

      try {
        const result = await IdentityService.verifyNin(nin, capturedImage);
        if (result.status === "VERIFIED") {
          setPhase("success");
          onSuccess?.();
        } else {
          setPhase("failed");
          setError("We were unable to verify your identity. Please try again.");
        }
      } catch (err) {
        setPhase("failed");
        setError(
          err instanceof ServiceError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
        );
      }
    },
    [capturedImage, onSuccess],
  );

  const reset = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    setError(null);
    setPhase("idle");
  }, [stopCamera]);

  return {
    phase,
    error,
    capturedImage,
    videoRef,
    startCamera,
    capture,
    retake,
    submit,
    reset,
  };
}
