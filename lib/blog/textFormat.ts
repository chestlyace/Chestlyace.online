// The paragraph block's toolbar and shortcuts (design.md §13.48): bold, italic,
// link, inline code and lists, applied to the selected text of a text area.

export type Format =
  "bold" | "italic" | "code" | "link" | "bullets" | "numbers";

export type Edit = { text: string; start: number; end: number };

const wrap = (text: string, start: number, end: number, mark: string): Edit => {
  const before = text.slice(0, start);
  const chosen = text.slice(start, end);
  const after = text.slice(end);
  // Formatting again what is already marked takes the marks off.
  if (before.endsWith(mark) && after.startsWith(mark)) {
    return {
      text: before.slice(0, -mark.length) + chosen + after.slice(mark.length),
      start: start - mark.length,
      end: end - mark.length,
    };
  }
  return {
    text: before + mark + chosen + mark + after,
    start: start + mark.length,
    end: end + mark.length,
  };
};

export function applyFormat(
  text: string,
  start: number,
  end: number,
  format: Format,
): Edit {
  switch (format) {
    case "bold":
      return wrap(text, start, end, "**");
    case "italic":
      return wrap(text, start, end, "*");
    case "code":
      return wrap(text, start, end, "`");
    case "link": {
      const chosen = text.slice(start, end) || "link text";
      const url = "https://";
      const out = `${text.slice(0, start)}[${chosen}](${url})${text.slice(end)}`;
      // The address is what is left to type.
      const from = start + chosen.length + 3;
      return { text: out, start: from, end: from + url.length };
    }
    case "bullets":
    case "numbers": {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      const lineEndAt = text.indexOf("\n", end);
      const lineEnd = lineEndAt === -1 ? text.length : lineEndAt;
      const lines = text.slice(lineStart, lineEnd).split("\n");
      const marked = lines.map((line, index) =>
        format === "bullets" ? `- ${line}` : `${index + 1}. ${line}`,
      );
      const body = marked.join("\n");
      return {
        text: text.slice(0, lineStart) + body + text.slice(lineEnd),
        start: lineStart,
        end: lineStart + body.length,
      };
    }
  }
}
