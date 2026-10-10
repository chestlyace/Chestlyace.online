"use client";

import { useLang } from "@/components/shared/LangProvider";
import { BLOCK_TEXT, type BlockText } from "@/lib/i18n/ui";

/** The words of a post's interactive blocks in the page's language. */
export function useBlockText(): BlockText {
  return BLOCK_TEXT[useLang()];
}
