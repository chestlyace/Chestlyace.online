import Image from "next/image";
import type { CSSProperties } from "react";
import type { SkillIcon } from "@/lib/skills";

// A skill's logo (design.md §14.3): drawn as a mask filled with the text colour
// (80%), so it is one colour in either theme; hovering the tile (`group/tile`)
// fades in the full-colour logo. Logos whose brand colour would vanish in a theme
// have no colour version and stay one colour. 28px, decorative (the name is text).
export function SkillLogo({ icon }: { icon: SkillIcon }) {
  if (!icon) return <span className="size-7 shrink-0" aria-hidden="true" />;

  if (icon.kind === "url") {
    // From elsewhere (one in the old data): grayscale until hovered.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon.src}
        alt=""
        width={28}
        height={28}
        loading="lazy"
        className="size-7 shrink-0 object-contain opacity-80 grayscale transition duration-200 ease-out group-hover/tile:opacity-100 group-hover/tile:grayscale-0 dark:invert dark:group-hover/tile:invert-0"
      />
    );
  }

  const mask = `url(/devicon/${icon.mono}.svg)`;
  const style: CSSProperties = {
    maskImage: mask,
    WebkitMaskImage: mask,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };

  return (
    <span className="relative size-7 shrink-0" aria-hidden="true">
      <span className="absolute inset-0 bg-foreground/80" style={style} />
      {icon.color && (
        <Image
          src={`/devicon/${icon.color}.svg`}
          alt=""
          width={28}
          height={28}
          unoptimized
          loading="lazy"
          className="absolute inset-0 size-7 opacity-0 transition-opacity duration-200 ease-out group-hover/tile:opacity-100"
        />
      )}
    </span>
  );
}
