import { CreativesNotFound } from "@/components/notfound/NotFound";
import { getCachedEvents, getCachedPieces } from "@/lib/creatives/cache";
import { featuredWork } from "@/lib/creatives/home";
import { thumbnailUrl } from "@/lib/cloudinary";
import type { Lang } from "@/lib/i18n";

// The creatives' 404 (design.md §13.67): some featured work, in both languages (a
// not-found page is given no route params, so the page picks the visitor's).
export default async function NotFound() {
  const read = async (lang: Lang) => {
    const [pieces, events] = await Promise.all([
      getCachedPieces(lang),
      getCachedEvents(lang),
    ]);
    return featuredWork(pieces, events, 3).map((item) => ({
      href: item.href,
      title: item.title,
      image: thumbnailUrl(item.image.url, 480),
    }));
  };
  const [en, fr] = await Promise.all([read("en"), read("fr")]);
  return <CreativesNotFound work={{ en, fr }} />;
}
