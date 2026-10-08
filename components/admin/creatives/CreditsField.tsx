"use client";

import { Plus } from "lucide-react";
import { useId } from "react";
import { fieldControl } from "@/components/shared/FormField";
import type { Credit } from "@/lib/admin/creativesForm";
import { cn } from "@/lib/cn";
import { AddButton, Card, moved, replaced } from "../blog/formParts";

const small = cn(fieldControl, "h-10 px-3 text-[0.9375rem]");

// An event's credits (design.md §14.26): rows of "Role — Name", each with an
// optional link, in the order they are shown.
export function CreditsField({
  credits,
  onChange,
  max = 30,
}: {
  credits: Credit[];
  onChange: (credits: Credit[]) => void;
  max?: number;
}) {
  const uid = useId();
  const edit = (index: number, patch: Partial<Credit>) =>
    onChange(replaced(credits, index, { ...credits[index], ...patch }));

  return (
    <div>
      {credits.length > 0 && (
        <ul className="mb-4 grid gap-3">
          {credits.map((credit, index) => (
            <Card
              key={index}
              label={`Credit ${index + 1}`}
              index={index}
              total={credits.length}
              onMove={(to) => onChange(moved(credits, index, to))}
              onRemove={() => onChange(credits.filter((_, i) => i !== index))}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`${uid}-role-${index}`}
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Role
                  </label>
                  <input
                    id={`${uid}-role-${index}`}
                    value={credit.role}
                    placeholder="Photography"
                    onChange={(event) =>
                      edit(index, { role: event.target.value })
                    }
                    className={small}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`${uid}-name-${index}`}
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Name
                  </label>
                  <input
                    id={`${uid}-name-${index}`}
                    value={credit.name}
                    placeholder="Chestly Ace"
                    onChange={(event) =>
                      edit(index, { name: event.target.value })
                    }
                    className={small}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor={`${uid}-url-${index}`}
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Link{" "}
                  <span className="font-normal text-muted">(optional)</span>
                </label>
                <input
                  id={`${uid}-url-${index}`}
                  value={credit.url}
                  inputMode="url"
                  placeholder="https://…"
                  onChange={(event) => edit(index, { url: event.target.value })}
                  className={small}
                />
              </div>
            </Card>
          ))}
        </ul>
      )}
      <AddButton
        onClick={() => onChange([...credits, { role: "", name: "", url: "" }])}
        disabled={credits.length >= max}
        icon={<Plus className="size-4" aria-hidden="true" />}
      >
        Add a credit
      </AddButton>
    </div>
  );
}
