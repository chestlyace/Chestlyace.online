import QRCode from "qrcode";

// A QR code as one SVG path (one unit square per dark module), so it can be
// drawn by a server component with no client code and no raw HTML.
export function qrPath(text: string): { size: number; d: string } {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const { size, data } = modules;
  let d = "";
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      if (!data[y * size + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < size && data[y * size + x]) x++;
      d += `M${start} ${y}h${x - start}v1h-${x - start}z`;
    }
  }
  return { size, d };
}
