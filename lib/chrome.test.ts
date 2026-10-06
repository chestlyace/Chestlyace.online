import { describe, expect, it } from "vitest";
import { footerLinks } from "./chrome";
import type { HomepageData } from "./db";

type Profile = NonNullable<HomepageData["profile"]>;
type Social = HomepageData["socials"][number];

const profile = (overrides: Partial<Profile> = {}) =>
  ({
    id: 1,
    name: "Chestly Ace",
    email: "chestlyace@gmail.com",
    whatsappNumber: "237676940247",
    resumeUrl: "resume.pdf",
    ...overrides,
  }) as Profile;

const social = (platform: string, url: string) =>
  ({ platform, url, icon: platform.toLowerCase() }) as Social;

describe("footerLinks", () => {
  it("builds Connect from the socials, as external links", () => {
    const { connect } = footerLinks({
      profile: profile(),
      socials: [
        social("GitHub", "https://github.com/chestlyace"),
        social("LinkedIn", "https://linkedin.com/in/chestlyace"),
      ],
    });
    expect(connect).toEqual([
      {
        label: "GitHub",
        href: "https://github.com/chestlyace",
        external: true,
      },
      {
        label: "LinkedIn",
        href: "https://linkedin.com/in/chestlyace",
        external: true,
      },
    ]);
  });

  it("builds Contact: email, WhatsApp, resume", () => {
    const { contact } = footerLinks({ profile: profile(), socials: [] });
    expect(contact).toEqual([
      { label: "chestlyace@gmail.com", href: "mailto:chestlyace@gmail.com" },
      {
        label: "WhatsApp",
        href: "https://wa.me/237676940247",
        external: true,
      },
      { label: "Resume", href: "/resume.pdf", external: false },
    ]);
  });

  it("keeps digits only in the WhatsApp number", () => {
    const { contact } = footerLinks({
      profile: profile({ whatsappNumber: "+237 676-940 247" }),
      socials: [],
    });
    expect(contact.find((l) => l.label === "WhatsApp")?.href).toBe(
      "https://wa.me/237676940247",
    );
  });

  it("leaves out WhatsApp and the resume when they are missing or blank", () => {
    for (const whatsappNumber of [null, "", "n/a"]) {
      const { contact } = footerLinks({
        profile: profile({ whatsappNumber, resumeUrl: null }),
        socials: [],
      });
      expect(contact.map((l) => l.label)).toEqual(["chestlyace@gmail.com"]);
    }
  });

  it("serves a bare file name or a leading-slash path from the site root", () => {
    for (const resumeUrl of ["resume.pdf", "/resume.pdf", "//resume.pdf"]) {
      const { contact } = footerLinks({
        profile: profile({ resumeUrl }),
        socials: [],
      });
      expect(contact.at(-1)).toEqual({
        label: "Resume",
        href: "/resume.pdf",
        external: false,
      });
    }
  });

  it("links a full resume URL as external", () => {
    const { contact } = footerLinks({
      profile: profile({ resumeUrl: "https://res.cloudinary.com/x/cv.pdf" }),
      socials: [],
    });
    expect(contact.at(-1)).toEqual({
      label: "Resume",
      href: "https://res.cloudinary.com/x/cv.pdf",
      external: true,
    });
  });

  it("returns empty columns when there is no profile", () => {
    expect(footerLinks({ profile: null, socials: [] })).toEqual({
      connect: [],
      contact: [],
    });
  });
});
