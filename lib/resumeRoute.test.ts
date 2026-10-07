import { beforeEach, describe, expect, it, vi } from "vitest";

const data = vi.hoisted(() => ({
  profile: null as { resumeUrl: string | null } | null,
}));
vi.mock("@/lib/portfolio", () => ({
  getCachedHomepageData: async () => ({ profile: data.profile }),
}));

import { GET } from "../app/sites/main/resume.pdf/route";

const call = () => GET(new Request("https://chestlyace.online/resume.pdf"));

beforeEach(() => {
  data.profile = { resumeUrl: null };
});

describe("/resume.pdf", () => {
  it("redirects to an uploaded résumé", async () => {
    data.profile = {
      resumeUrl:
        "https://res.cloudinary.com/x/raw/upload/v1/portfolio/profile/cv.pdf",
    };
    const response = await call();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://res.cloudinary.com/x/raw/upload/v1/portfolio/profile/cv.pdf",
    );
  });

  it("redirects to another file on the site", async () => {
    data.profile = { resumeUrl: "files/cv-2026.pdf" };
    const response = await call();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://chestlyace.online/files/cv-2026.pdf",
    );
  });

  it("is a 404, not a loop, when the profile points back at /resume.pdf", async () => {
    data.profile = { resumeUrl: "resume.pdf" };
    expect((await call()).status).toBe(404);
  });

  it("is a 404 without a résumé or a profile", async () => {
    expect((await call()).status).toBe(404);
    data.profile = null;
    expect((await call()).status).toBe(404);
  });
});
