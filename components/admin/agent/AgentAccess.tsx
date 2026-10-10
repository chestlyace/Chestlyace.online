"use client";

import { Check, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/shared/Button";
import { FormField, fieldControl } from "@/components/shared/FormField";
import { Tag } from "@/components/shared/Tag";
import { Chip } from "../Chip";
import { relativeTime } from "@/lib/admin/time";
import { cn } from "@/lib/cn";
import { SCOPES, SCOPE_HELP, type Scope } from "@/lib/mcp/scopes";
import type { TokenView } from "@/lib/mcp/tokens";
import { useConfirm } from "../ConfirmDialog";
import { Switch } from "../Switch";
import { useToast } from "../Toast";

const EXPIRIES = [
  ["30", "30 days"],
  ["90", "90 days"],
  ["365", "1 year"],
  ["never", "Never"],
] as const;

type Created = { token: string; item: TokenView };

function statusOf(
  token: TokenView,
  now: number,
): "active" | "revoked" | "expired" {
  if (token.revokedAt) return "revoked";
  if (token.expiresAt && Date.parse(token.expiresAt) <= now) return "expired";
  return "active";
}

// Settings → Agent access (docs/mcp.md §7): the tokens an agent connects with, a form for a
// new one (shown once, with the connection snippet) and Revoke. Admin-only, English.
export function AgentAccess({
  tokens,
  endpoint,
  now,
}: {
  tokens: TokenView[];
  endpoint: string;
  /** The server's time, so the list reads the same on both sides. */
  now: number;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<Scope[]>(["write"]);
  const [expires, setExpires] = useState<(typeof EXPIRIES)[number][0]>("90");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(key);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 2000);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    try {
      const response = await fetch("/api/admin/agent/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scopes, expires }),
      });
      const result = (await response.json().catch(() => ({}))) as
        Created | { fields?: Record<string, string> };
      if (response.ok && "token" in result) {
        setCreated(result);
        setName("");
        router.refresh();
      } else if (response.status === 401) {
        router.replace("/login?reason=expired&next=/agent");
      } else if ("fields" in result && result.fields) setErrors(result.fields);
      else toast.error("Couldn't create the token. Try again.");
    } catch {
      toast.error("Couldn't reach the server. Check your connection.");
    }
    setBusy(false);
  };

  const revoke = async (token: TokenView) => {
    if (
      !(await confirm({
        title: `Revoke “${token.name}”?`,
        text: "It stops working at once. An agent using it will be refused. You can't undo this.",
        confirmLabel: "Revoke",
      }))
    )
      return;
    const response = await fetch(`/api/admin/agent/tokens/${token.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      toast.success("Token revoked.");
      router.refresh();
    } else toast.error("Couldn't revoke that. Try again.");
  };

  const header = created ? `Authorization: Bearer ${created.token}` : "";
  const cli = created
    ? `claude mcp add --transport http chestly ${endpoint} --header "${header}"`
    : "";
  const json = created
    ? JSON.stringify(
        {
          mcpServers: {
            chestly: {
              type: "http",
              url: endpoint,
              headers: { Authorization: `Bearer ${created.token}` },
            },
          },
        },
        null,
        2,
      )
    : "";

  const snippet = (key: string, label: string, text: string) => (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <Button
          variant="ghost"
          size="sm"
          magnetic={false}
          onClick={() => void copy(key, text)}
          trailingIcon={copied === key ? <Check /> : <Copy />}
          iconNudge="none"
        >
          {copied === key ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-tile px-4 py-3 font-mono text-[0.8125rem] leading-[1.6] whitespace-pre text-foreground shadow-[inset_0_0_0_1px_var(--border)]">
        {text}
      </pre>
    </div>
  );

  return (
    <div className="grid max-w-[45rem] gap-12">
      {created && (
        <section
          aria-label="New token"
          className="grid gap-5 rounded-lg bg-surface-raised p-5 shadow-[inset_0_0_0_1px_var(--border)]"
        >
          <div>
            <h2 className="text-h3 text-foreground">
              “{created.item.name}” is ready
            </h2>
            <p className="mt-1 text-sm text-danger">
              Copy it now. It is shown only once and can&apos;t be shown again.
            </p>
          </div>
          {snippet("token", "Token", created.token)}
          {snippet("cli", "Claude Code", cli)}
          {snippet("json", "Claude Desktop, Cursor and others (JSON)", json)}
          <div>
            <Button
              variant="secondary"
              magnetic={false}
              onClick={() => setCreated(null)}
            >
              I&apos;ve saved it
            </Button>
          </div>
        </section>
      )}

      <section aria-labelledby="tokens-title">
        <h2 id="tokens-title" className="text-h3 text-foreground">
          Tokens
        </h2>
        {tokens.length === 0 ? (
          <p className="mt-3 text-body text-muted">
            No tokens yet. Create one below to let an agent use the admin.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {tokens.map((token) => {
              const status = statusOf(token, now);
              return (
                <li
                  key={token.id}
                  className={cn(
                    "grid gap-3 rounded-lg bg-surface p-4",
                    status !== "active" && "opacity-70",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {token.name}
                      </p>
                      <p className="font-mono text-sm text-muted">
                        {token.prefix}…
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Chip tone={status === "active" ? "on" : "off"}>
                        {status === "active"
                          ? "Active"
                          : status === "revoked"
                            ? "Revoked"
                            : "Expired"}
                      </Chip>
                      {status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          magnetic={false}
                          onClick={() => void revoke(token)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {token.scopes.map((scope) => (
                      <Tag key={scope}>{SCOPE_HELP[scope].label}</Tag>
                    ))}
                  </div>
                  <p className="text-sm text-muted">
                    Created{" "}
                    {relativeTime(new Date(token.createdAt), new Date(now))} ·
                    Last used{" "}
                    {token.lastUsedAt
                      ? relativeTime(new Date(token.lastUsedAt), new Date(now))
                      : "never"}{" "}
                    ·{" "}
                    {token.expiresAt
                      ? `Expires ${new Date(token.expiresAt).toISOString().slice(0, 10)}`
                      : "Never expires"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <form
        onSubmit={submit}
        noValidate
        aria-label="New token"
        className="grid gap-6"
      >
        <h2 className="text-h3 text-foreground">New token</h2>
        <FormField
          id="token-name"
          label="Name"
          error={errors.name}
          helper="Who or what will use it: “Claude Desktop”."
        >
          <input
            id="token-name"
            name="name"
            value={name}
            maxLength={60}
            autoComplete="off"
            aria-invalid={errors.name ? true : undefined}
            onChange={(event) => setName(event.target.value)}
            className={cn(fieldControl, "h-12 px-4")}
          />
        </FormField>

        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm font-medium text-foreground">
            What it may do
          </legend>
          {SCOPES.map((scope) => (
            <div key={scope} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-body text-foreground">
                  {SCOPE_HELP[scope].label}
                </p>
                <p className="text-sm text-muted">{SCOPE_HELP[scope].help}</p>
              </div>
              <Switch
                checked={scope === "read" || scopes.includes(scope)}
                disabled={scope === "read"}
                label={SCOPE_HELP[scope].label}
                onChange={(next) =>
                  setScopes((now) =>
                    next
                      ? [...now, scope]
                      : now.filter((item) => item !== scope),
                  )
                }
              />
            </div>
          ))}
          {errors.scopes && (
            <p role="alert" className="text-sm text-danger">
              {errors.scopes}
            </p>
          )}
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium text-foreground">
            Expires
          </legend>
          <div role="radiogroup" className="flex flex-wrap gap-2">
            {EXPIRIES.map(([value, text]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={expires === value}
                onClick={() => setExpires(value)}
                className={cn(
                  "type-label h-9 rounded-full px-4 transition-colors duration-150",
                  expires === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-tile text-muted hover:text-foreground",
                )}
              >
                {text}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <Button type="submit" loading={busy} magnetic={false}>
            Create token
          </Button>
        </div>
      </form>
    </div>
  );
}
