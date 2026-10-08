"use client";

import { ChevronDown, LogOut, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { authClient } from "@/lib/blog/authClient";
import type { ProviderId } from "@/lib/blog/auth";
import type { CommentView } from "@/lib/blog/comments";
import { cn } from "@/lib/cn";
import { Avatar } from "./Avatar";
import { CommentItem } from "./CommentItem";
import { Composer } from "./Composer";
import { Dialog } from "./Dialog";
import { SignInDialog, SignInPanel } from "./SignIn";

type ReaderInfo = {
  id: string;
  name: string;
  image: string | null;
  isAuthor: boolean;
};
type Loaded = {
  items: CommentView[];
  total: number;
  nextCursor: number | null;
  enabled: boolean;
  maxWords: number;
  providers: ProviderId[];
  reader: ReaderInfo | null;
};

// Applies a change to one comment wherever it is (top level or a reply).
const mapComments = (
  items: CommentView[],
  id: number,
  change: Partial<CommentView>,
): CommentView[] =>
  items.map((item) =>
    item.id === id
      ? { ...item, ...change }
      : { ...item, replies: mapComments(item.replies, id, change) },
  );

const dropComment = (items: CommentView[], id: number): CommentView[] =>
  items
    .filter((item) => item.id !== id)
    .map((item) => ({ ...item, replies: dropComment(item.replies, id) }));

// The comments under a post (design.md §13.37): the count, the composer or the
// sign-in panel, the list. Loaded after the page from the blog's API, so the post
// page itself stays cached.
export function Comments({ slug }: { slug: string }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [more, setMore] = useState<"idle" | "loading">("idle");
  const [signIn, setSignIn] = useState(false);
  const [failed, setFailed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [accountError, setAccountError] = useState(false);
  const menuRoot = useRef<HTMLDivElement>(null);
  const endpoint = `/api/blog/posts/${encodeURIComponent(slug)}/comments`;

  // Reads the comments; the result is applied by whoever asked (the effect below on
  // arrival, or `reload` after signing out).
  const fetchComments = useCallback(async (): Promise<Loaded | null> => {
    try {
      const response = await fetch(endpoint);
      return response.ok ? ((await response.json()) as Loaded) : null;
    } catch {
      return null;
    }
  }, [endpoint]);

  const apply = useCallback((loaded: Loaded | null) => {
    if (!loaded) return setState("error");
    setData(loaded);
    setState("ready");
    setFailed(
      new URLSearchParams(window.location.search).get("signin") === "failed",
    );
  }, []);

  const reload = async () => {
    setState("loading");
    apply(await fetchComments());
  };

  useEffect(() => {
    let current = true;
    void fetchComments().then((loaded) => current && apply(loaded));
    return () => {
      current = false;
    };
  }, [fetchComments, apply]);

  useEffect(() => {
    if (!menu) return;
    const away = (event: PointerEvent) => {
      if (!menuRoot.current?.contains(event.target as Node)) setMenu(false);
    };
    const key = (event: KeyboardEvent) =>
      event.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", key);
    };
  }, [menu]);

  const update = (next: (current: Loaded) => Loaded) =>
    setData((current) => (current ? next(current) : current));

  const loadMore = async () => {
    if (!data?.nextCursor || more === "loading") return;
    setMore("loading");
    try {
      const response = await fetch(`${endpoint}?cursor=${data.nextCursor}`);
      if (response.ok) {
        const page = (await response.json()) as Loaded;
        update((current) => ({
          ...current,
          items: [...current.items, ...page.items],
          nextCursor: page.nextCursor,
          total: page.total,
        }));
      }
    } catch {
      // the button stays, to try again
    }
    setMore("idle");
  };

  const signOut = async () => {
    setMenu(false);
    await authClient.signOut();
    await reload();
  };

  const deleteAccount = async () => {
    setAccountError(false);
    const result = await authClient.deleteUser();
    if (result?.error) return setAccountError(true);
    setDeleting(false);
    await reload();
  };

  if (data && !data.enabled) return null;

  const reader = data?.reader ?? null;

  return (
    <section
      id="comments"
      aria-labelledby="comments-title"
      className="scroll-mt-24"
    >
      <h2 id="comments-title" className="text-h3 text-foreground">
        Comments{" "}
        {data && <span className="font-mono text-muted">{data.total}</span>}
      </h2>

      <div className="mt-6">
        {state === "ready" &&
          data &&
          (reader ? (
            <>
              <div
                className="mb-5 flex items-center justify-between gap-3"
                ref={menuRoot}
              >
                <p className="text-sm text-muted">Signed in as</p>
                <div className="relative flex items-center gap-1">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={menu}
                    onClick={() => setMenu((value) => !value)}
                    className="flex h-9 items-center gap-2 rounded-full pr-2 pl-1 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-tile"
                  >
                    <Avatar name={reader.name} image={reader.image} size={28} />
                    {reader.name}
                    <ChevronDown
                      className="size-4 text-muted"
                      aria-hidden="true"
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    magnetic={false}
                    onClick={() => void signOut()}
                    trailingIcon={<LogOut />}
                    iconNudge="none"
                  >
                    Sign out
                  </Button>
                  {menu && (
                    <div
                      role="menu"
                      className="absolute top-full left-0 z-10 mt-1 w-52 rounded-md border border-border/60 bg-surface-raised p-1 shadow-float-lifted"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenu(false);
                          setDeleting(true);
                        }}
                        className="flex h-10 w-full items-center gap-2 rounded-sm px-3 text-left text-sm text-danger hover:bg-tile"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete my account
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Composer
                slug={slug}
                reader={reader}
                maxWords={data.maxWords}
                onPosted={(comment) =>
                  update((current) => ({
                    ...current,
                    items: [comment, ...current.items],
                    total: current.total + 1,
                  }))
                }
              />
            </>
          ) : (
            <SignInPanel providers={data.providers} failed={failed} />
          ))}
      </div>

      <div className="mt-10">
        {state === "loading" && (
          <div
            aria-label="Loading comments"
            role="status"
            className="flex flex-col gap-6"
          >
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex items-start gap-3">
                <div className="size-8 shrink-0 rounded-full bg-surface" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/4 rounded-sm bg-surface" />
                  <div className="h-4 w-3/4 rounded-sm bg-surface" />
                </div>
              </div>
            ))}
          </div>
        )}

        {state === "error" && (
          <p role="alert" className="text-sm text-danger">
            Comments couldn&apos;t load.{" "}
            <button
              type="button"
              onClick={() => void reload()}
              className="link-inline text-foreground"
            >
              Try again
            </button>
          </p>
        )}

        {state === "ready" &&
          data &&
          (data.items.length === 0 ? (
            <p className="text-muted">No comments yet. Be the first.</p>
          ) : (
            <>
              <ul className="flex flex-col gap-8">
                {data.items.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    slug={slug}
                    signedIn={Boolean(reader)}
                    reader={reader}
                    maxWords={data.maxWords}
                    onNeedSignIn={() => setSignIn(true)}
                    onPosted={(parentId, created) =>
                      update((current) => ({
                        ...current,
                        total: current.total + 1,
                        items: current.items.map((item) =>
                          item.id === parentId
                            ? { ...item, replies: [...item.replies, created] }
                            : item,
                        ),
                      }))
                    }
                    onChanged={(id, change) =>
                      update((current) => ({
                        ...current,
                        items: mapComments(current.items, id, change),
                      }))
                    }
                    onDeleted={(id) =>
                      update((current) => ({
                        ...current,
                        total: Math.max(0, current.total - 1),
                        items: dropComment(current.items, id),
                      }))
                    }
                  />
                ))}
              </ul>
              {data.nextCursor && (
                <div className={cn("mt-8")}>
                  <Button
                    variant="ghost"
                    magnetic={false}
                    loading={more === "loading"}
                    onClick={() => void loadMore()}
                  >
                    Load more comments
                  </Button>
                </div>
              )}
            </>
          ))}
      </div>

      {signIn && data && (
        <SignInDialog
          providers={data.providers}
          onClose={() => setSignIn(false)}
        />
      )}
      {deleting && (
        <Dialog title="Delete your account?" onClose={() => setDeleting(false)}>
          <p className="text-body text-muted">
            Your account and your sign-in are removed. Your comments stay, shown
            as “Deleted user”, and your likes on comments go.
          </p>
          {accountError && (
            <p role="alert" className="mt-3 text-sm text-danger">
              That didn&apos;t work. Sign out, sign in again, and try once more.
            </p>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              magnetic={false}
              autoFocus
              onClick={() => setDeleting(false)}
            >
              Cancel
            </Button>
            <Button magnetic={false} onClick={() => void deleteAccount()}>
              Delete my account
            </Button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
