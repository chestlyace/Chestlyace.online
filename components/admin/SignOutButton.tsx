"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/shared/Button";

// Clears the session, then goes to the login with a note (design.md §13.26).
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login?reason=signed-out");
      router.refresh();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      magnetic={false}
      loading={busy}
      onClick={signOut}
      trailingIcon={<LogOut />}
      iconNudge="none"
    >
      Sign out
    </Button>
  );
}
