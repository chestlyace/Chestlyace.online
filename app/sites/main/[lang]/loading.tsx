// What Next shows while this site's page is on its way (design.md §13.64–13.65). The
// brand loader is the navigation overlay's job (after 400ms, over the whole page), so
// the shell keeps the page's space under the header; 12b.2 fills it with a skeleton
// shaped like each page.
export default function Loading() {
  return <div aria-busy="true" className="min-h-[60dvh] flex-1" />;
}
