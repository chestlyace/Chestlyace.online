// First focusable element on every page: jumps past the header to <main>
// (design.md §13.9). Hidden until focused with the keyboard.
export function SkipLink({ label = "Skip to content" }: { label?: string }) {
  return (
    <a
      href="#main"
      data-skip-link
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[60] focus-visible:inline-flex focus-visible:h-11 focus-visible:items-center focus-visible:rounded-full focus-visible:bg-primary focus-visible:px-6 focus-visible:text-[0.9375rem] focus-visible:font-medium focus-visible:text-primary-foreground"
    >
      {label}
    </a>
  );
}
