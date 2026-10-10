"use client";

// The last resort (design.md §13.67): the layout itself failed, so there is no header, no
// footer and no stylesheet. A plain page with a way to try again and a way home. English
// and French together, since the language is not known here.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <main>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>
            Something broke on our side
          </h1>
          <p style={{ color: "#6e6e73" }}>
            Un problème est survenu de notre côté.
          </p>
          <p>
            <button
              type="button"
              onClick={reset}
              style={{
                font: "inherit",
                padding: "0.75rem 1.5rem",
                borderRadius: "999px",
                border: 0,
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Try again · Réessayer
            </button>
          </p>
        </main>
      </body>
    </html>
  );
}
