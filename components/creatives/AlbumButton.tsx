import { Button } from "@/components/shared/Button";
import { ArrowUpRight } from "lucide-react";
import { isHttpUrl } from "@/lib/links";
import type { PublicEvent } from "@/lib/creatives/data";
import { albumService } from "@/lib/creatives/events";

// "View the full album ↗" (design.md §14.23): the address and the service's name come
// from the event in the admin; with no address there is no button.
export function AlbumButton({ event }: { event: PublicEvent }) {
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
        View the full album
      </Button>
      {service && <p className="type-label text-muted">On {service}</p>}
    </div>
  );
}
