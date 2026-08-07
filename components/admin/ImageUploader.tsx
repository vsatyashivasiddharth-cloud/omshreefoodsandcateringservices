"use client";

import type {
  ChangeEvent,
} from "react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  CheckCircle2,
  ImageIcon,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/lib/supabase";

interface ImageUploaderProps {
  bucket: string;
  folder?: string;
  value: string;
  onChange: (url: string) => void;
}

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function sanitizeFileName(
  fileName: string,
) {
  const extension =
    fileName
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "jpg";

  const nameWithoutExtension =
    fileName
      .replace(
        /\.[^/.]+$/,
        "",
      )
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      );

  return `${
    nameWithoutExtension ||
    "image"
  }.${extension}`;
}

export default function ImageUploader({
  bucket,
  folder = "",
  value,
  onChange,
}: ImageUploaderProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    previewError,
    setPreviewError,
  ] = useState(false);

  const normalizedValue =
    value.trim();

  /*
   * Whenever the parent loads a
   * different image, allow the new
   * image to attempt rendering.
   */
  useEffect(() => {
    setPreviewError(false);
  }, [normalizedValue]);

  async function uploadImage(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !ALLOWED_FILE_TYPES.includes(
        file.type,
      )
    ) {
      toast.error(
        "Only JPG, PNG and WebP images are supported.",
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      toast.error(
        "The image must be smaller than 5 MB.",
      );

      event.target.value = "";

      return;
    }

    try {
      setUploading(true);
      setPreviewError(false);

      const safeFileName =
        sanitizeFileName(
          file.name,
        );

      const uniqueFileName =
        `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

      const normalizedFolder =
        folder
          .trim()
          .replace(
            /^\/+|\/+$/g,
            "",
          );

      const filePath =
        normalizedFolder
          ? `${normalizedFolder}/${uniqueFileName}`
          : uniqueFileName;

      const {
        error,
      } =
        await supabase.storage
          .from(bucket)
          .upload(
            filePath,
            file,
            {
              cacheControl:
                "3600",

              contentType:
                file.type,

              upsert: false,
            },
          );

      if (error) {
        throw new Error(
          error.message,
        );
      }

      const {
        data:
          publicUrlData,
      } =
        supabase.storage
          .from(bucket)
          .getPublicUrl(
            filePath,
          );

      const publicUrl =
        publicUrlData
          .publicUrl
          ?.trim();

      if (!publicUrl) {
        throw new Error(
          "Unable to generate the image URL.",
        );
      }

      onChange(publicUrl);

      toast.success(
        "Image uploaded successfully.",
      );
    } catch (error) {
      console.error(
        "Image upload error:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Image upload failed.",
      );
    } finally {
      setUploading(false);

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    }
  }

  function removeImage() {
    if (uploading) {
      return;
    }

    onChange("");
    setPreviewError(false);

    if (
      inputRef.current
    ) {
      inputRef.current.value =
        "";
    }
  }

  return (
    <div className="space-y-5">
      {normalizedValue && (
        <div className="overflow-hidden rounded-2xl border border-green-200 bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-green-200 bg-green-50 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                <CheckCircle2
                  size={21}
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-green-800">
                  Image ready
                </p>

                <p className="text-sm text-green-700">
                  This image will be
                  saved with your
                  item.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                removeImage
              }
              disabled={
                uploading
              }
              aria-label="Remove uploaded image"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-green-800 transition hover:bg-green-100 focus:outline-none focus:ring-4 focus:ring-green-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X
                size={19}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="p-4 sm:p-5">
            <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-[#F3DFC2] bg-gradient-to-br from-[#FFF8EA] via-[#FFF4DE] to-[#FFE8BF]">
              {previewError ? (
                <div className="absolute inset-0 flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#C89B3C]/20 bg-white/75 shadow-sm">
                    <ImageIcon
                      size={30}
                      className="text-[#C89B3C]"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-4 font-semibold text-[#6D2E00]">
                    Preview
                    unavailable
                  </p>

                  <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500">
                    This image URL
                    could not be
                    displayed. Replace
                    or remove it before
                    saving if needed.
                  </p>
                </div>
              ) : (
                <Image
                  src={
                    normalizedValue
                  }
                  alt="Uploaded image preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-cover"
                  onError={() => {
                    setPreviewError(
                      true,
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <label
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
          uploading
            ? "cursor-not-allowed border-[#E7C98C] bg-[#FFF8EE] opacity-75"
            : "cursor-pointer border-[#D9B97A] bg-[#FFFDF8] hover:border-[#C89B3C] hover:bg-[#FFF8EE]"
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF4DE] text-[#C89B3C]">
          {uploading ? (
            <RefreshCw
              size={28}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : normalizedValue ? (
            <RefreshCw
              size={28}
              aria-hidden="true"
            />
          ) : (
            <Upload
              size={28}
              aria-hidden="true"
            />
          )}
        </div>

        <h3 className="mt-4 text-lg font-semibold text-[#6D2E00]">
          {uploading
            ? "Uploading image..."
            : normalizedValue
              ? "Replace Image"
              : "Upload Image"}
        </h3>

        <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
          Choose a JPG, PNG or
          WebP image from your
          device. The maximum
          supported file size is
          5 MB.
        </p>

        <span className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#6D2E00] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#8B4513]">
          <ImageIcon
            size={18}
            aria-hidden="true"
          />

          {uploading
            ? "Please Wait..."
            : "Choose File"}
        </span>

        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={
            uploadImage
          }
          disabled={
            uploading
          }
          className="hidden"
        />
      </label>

      {uploading && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />

            <div>
              <p className="font-semibold text-blue-800">
                Uploading image
              </p>

              <p className="mt-1 text-sm text-blue-600">
                Please keep this
                window open until
                the upload finishes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}