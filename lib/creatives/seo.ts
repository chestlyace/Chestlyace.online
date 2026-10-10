import { getMessages } from "@/content/messages";
import { DEFAULT_LANG, localizedPath, type Lang } from "@/lib/i18n";
import { CREATIVES_UI } from "@/lib/i18n/ui";
import { PERSON_NAME, siteOrigin } from "@/lib/seo";
import type {
  PublicEvent,
  PublicFaq,
  PublicPiece,
  PublicService,
} from "./data";

const siteName = (lang: Lang) => getMessages(lang).seo.creatives.title;
const at = (origin: string, path: string, lang: Lang) =>
  `${origin}${localizedPath(path, lang)}`;

// Structured data for the creatives pages (design.md §14.21): the gallery as a
// CollectionPage whose pieces are CreativeWorks with their image.
export function designJsonLd(
  pieces: readonly PublicPiece[],
  origin: string = siteOrigin("creatives"),
  lang: Lang = DEFAULT_LANG,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: CREATIVES_UI[lang].groupDesign,
    url: at(origin, "/design", lang),
    inLanguage: lang,
    isPartOf: {
      "@type": "WebSite",
      name: siteName(lang),
      url: at(origin, "/", lang),
    },
    hasPart: pieces.map((piece) => ({
      "@type": "CreativeWork",
      name: piece.title,
      genre: piece.category,
      image: piece.cover.url,
      ...(piece.description ? { description: piece.description } : {}),
      ...(piece.client
        ? { sponsor: { "@type": "Organization", name: piece.client } }
        : {}),
      ...(piece.year ? { dateCreated: String(piece.year) } : {}),
      creator: { "@type": "Person", name: PERSON_NAME },
    })),
  };
}

// The Photography page (design.md §14.22): a collection of events.
export function photographyJsonLd(
  events: readonly PublicEvent[],
  origin: string = siteOrigin("creatives"),
  lang: Lang = DEFAULT_LANG,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: CREATIVES_UI[lang].groupPhotography,
    url: at(origin, "/photography", lang),
    inLanguage: lang,
    isPartOf: {
      "@type": "WebSite",
      name: siteName(lang),
      url: at(origin, "/", lang),
    },
    hasPart: events.map((event) => ({
      "@type": "Event",
      name: event.title,
      startDate: event.eventDate,
      url: at(origin, `/photography/${event.slug}`, lang),
      image: event.cover.url,
      ...(event.place
        ? { location: { "@type": "Place", name: event.place } }
        : {}),
    })),
  };
}

// One event page (design.md §14.23): an ImageGallery of its pictures, about the event.
export function eventJsonLd(
  event: PublicEvent,
  origin: string = siteOrigin("creatives"),
  lang: Lang = DEFAULT_LANG,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: event.title,
    url: at(origin, `/photography/${event.slug}`, lang),
    inLanguage: lang,
    ...(event.description ? { description: event.description } : {}),
    dateCreated: event.eventDate,
    ...(event.place
      ? { contentLocation: { "@type": "Place", name: event.place } }
      : {}),
    creator: { "@type": "Person", name: PERSON_NAME },
    primaryImageOfPage: { "@type": "ImageObject", contentUrl: event.cover.url },
    image: [event.cover, ...event.images].map((image) => ({
      "@type": "ImageObject",
      contentUrl: image.url,
      ...(image.alt ? { description: image.alt } : {}),
    })),
    about: {
      "@type": "Event",
      name: event.title,
      startDate: event.eventDate,
      ...(event.place
        ? { location: { "@type": "Place", name: event.place } }
        : {}),
    },
  };
}

// The Services page (design.md §14.24): each service as a Service, and the questions
// as a FAQPage. Returned as one list for the page's JSON-LD.
export function servicesJsonLd(
  services: readonly PublicService[],
  faqs: readonly PublicFaq[],
  origin: string = siteOrigin("creatives"),
  lang: Lang = DEFAULT_LANG,
): Record<string, unknown>[] {
  const provider = { "@type": "Person", name: PERSON_NAME, url: origin };
  const graph: Record<string, unknown>[] = services.map((service) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.description,
    serviceType:
      service.group === "photography"
        ? CREATIVES_UI[lang].groupPhotography
        : CREATIVES_UI[lang].groupDesign,
    provider,
    inLanguage: lang,
    url: at(origin, "/services", lang),
  }));
  if (faqs.length > 0) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: lang,
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }
  return graph;
}

// The home page (design.md §14.20): the person and the site, with each featured piece
// or event as a CreativeWork.
export function homeJsonLd(
  work: readonly { title: string; href: string; image: { url: string } }[],
  description: string,
  origin: string = siteOrigin("creatives"),
  lang: Lang = DEFAULT_LANG,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${origin}/#person`,
        name: PERSON_NAME,
        url: origin,
        jobTitle:
          lang === "fr"
            ? "Designer graphique et photographe"
            : "Graphic designer and photographer",
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: siteName(lang),
        url: at(origin, "/", lang),
        inLanguage: lang,
        description,
        publisher: { "@id": `${origin}/#person` },
      },
      ...work.map((item) => ({
        "@type": "CreativeWork",
        name: item.title,
        url: `${origin}${localizedPath(item.href, lang)}`,
        image: item.image.url,
        creator: { "@id": `${origin}/#person` },
      })),
    ],
  };
}
