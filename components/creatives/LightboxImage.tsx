"use client";

import { useState, type ComponentProps } from "react";
import { BrandLoader } from "@/components/shared/BrandLoader";
import { cn } from "@/lib/cn";

// The lightboxes' picture (design.md §13.66): the `md` brand loader on the dark layer
// until the image is decoded, then the picture fades in. Give it a `key` that changes
// with the picture so each one starts from the loader.
export function LightboxImage({
  className,
  alt,
  ...props
}: ComponentProps<"img"> & { alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      {!loaded && (
        <span className="pointer-events-none absolute inset-0 grid place-items-center">
          <BrandLoader size="md" tone="light" />
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary, sized by srcset */}
      <img
        {...props}
        alt={alt}
        ref={(element) => {
          // A picture already in the cache is complete before `onLoad` is attached.
          if (element?.complete && element.naturalWidth > 0) setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn(
          className,
          "transition-opacity duration-150 motion-reduce:transition-none",
          !loaded && "opacity-0",
        )}
      />
    </>
  );
}
