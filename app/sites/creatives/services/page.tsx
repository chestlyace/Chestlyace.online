import { ComingSoon } from "@/components/shared/ComingSoon";

// The old graphic-design.html and photography.html redirect here
// (ia-content.md §6). Until Phase 10 it shows the same page as `/`, whose
// canonical address the layout already gives it.
export default function CreativesServices() {
  return <ComingSoon site="creatives" />;
}
