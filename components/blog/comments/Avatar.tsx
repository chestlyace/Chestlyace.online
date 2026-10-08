import { cn } from "@/lib/cn";

// A reader's picture from their provider, or their initial (design.md §13.36).
export function Avatar({
  name,
  image,
  size = 32,
  className,
}: {
  name: string;
  image: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size };
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element -- the provider's own picture address
    <img
      src={image}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      style={style}
      className={cn("shrink-0 rounded-full bg-surface object-cover", className)}
    />
  ) : (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-surface text-sm font-semibold text-foreground",
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
