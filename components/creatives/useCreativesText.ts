"use client";

import { useLang } from "@/components/shared/LangProvider";
import { CREATIVES_UI, type CreativesUi } from "@/lib/i18n/ui";

/** The words of the creatives site in the page's language (client components). */
export function useCreativesText(): CreativesUi {
  return CREATIVES_UI[useLang()];
}
