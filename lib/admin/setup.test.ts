import { describe, expect, it } from "vitest";
import { setupNotices } from "./setup";

describe("setupNotices", () => {
  it("says nothing when everything is set", () => {
    expect(
      setupNotices({
        RESEND_API_KEY: "k",
        CLOUDINARY_CLOUD_NAME: "c",
        CLOUDINARY_API_KEY: "k",
        CLOUDINARY_API_SECRET: "s",
      }),
    ).toEqual([]);
  });

  it("names what is missing", () => {
    const notices = setupNotices({ CLOUDINARY_CLOUD_NAME: "c" });
    expect(notices).toHaveLength(2);
    expect(notices[0]).toMatch(/RESEND_API_KEY/);
    expect(notices[1]).toMatch(/Cloudinary|CLOUDINARY/);
  });
});
