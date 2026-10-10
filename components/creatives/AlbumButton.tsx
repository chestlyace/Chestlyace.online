import { Button } from "@/components/shared/Button";
import { ArrowUpRight } from "lucide-react";
import { isHttpUrl } from "@/lib/links";
import type { PublicEvent } from "@/lib/creatives/data";
import { albumService } from "@/lib/creatives/events";
import { type Lang } from "@/lib/i18n";
import { format } from "@/lib/i18n/format";
import { CREATIVES_UI } from "@/lib/i18n/ui";

// "View the full album ↗" (design.md §14.23): the address and the service's name come
// from the event in the admin; with no address there is no button.
export function AlbumButton({
  event,
  lang,
}: {
  event: PublicEvent;
  lang: Lang;
}) {
  const t = CREATIVES_UI[lang];
  if (!event.albumUrl || !isHttpUrl(event.albumUrl)) return null;
  const service = albumService(event);
  return (
    <div className="grid justify-items-start gap-2">
      <Button
        href={event.albumUrl}
        external
        trailingIcon={<ArrowUpRight aria-hidden="true" />}
        iconNudge="up-right"
      >
        {t.album}
      </Button>
      {service && (
        <p className="type-label text-muted">
          {format(t.albumOn, { service })}
        </p>
      )}
    </div>
  );
}
