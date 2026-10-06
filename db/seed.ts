// Dev-only seed: the old site's data (portfolio-webpage db/neon_setup.sql),
// adapted to the new schema. Wipes every table first. Never run against
// production — the runner below refuses to.
//
//   pnpm db:seed
//
// Design/event works and the creative services are left out (D8, D9). So are
// the creative roles (Q6), the creative tools (Q7, Figma stays), and the two
// design/photography FAQs (ia-content.md §2.9): they belong to the creatives
// site. The seven certifications are read from the badge images in the old
// repo's assets/certs/; their dates and credential links are not in the images,
// so they are left empty.
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema.ts";

type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

const devicon = (name: string) => ({ iconSlug: name, iconUrl: null });

export const seedData = {
  profile: {
    id: 1,
    name: "Chestly Ace",
    legalName: "Amahndong Chestly",
    displayName: "DEV.ACE",
    headline: "Software Engineer",
    // PLACEHOLDER — the hero's rotating words, until the owner supplies them.
    headlineWords: ["Backend", "Full-Stack", "Mobile"] as string[],
    tagline: "Open to Remote Roles",
    availability: "open",
    heroImageUrl: "684d5ff7-8d68-46ce-a5eb-5b0dabd64850.png",
    aboutQuote:
      "Blending logic with creativity to craft digital experiences that matter.",
    aboutBody: [
      "I am a multi-disciplinary creative based in the tech world. My journey started with a curiosity for how things work, leading me down the path of Software Engineering. Along the way, I discovered that function without form is incomplete, sparking my passion for Design and Photography.",
      "Whether I'm writing clean code in Python or capturing a candid moment through my lens, my goal is always the same: to tell a story and solve a problem elegantly. I believe in the power of minimalism and the impact of bold choices.",
    ].join("\n\n"),
    resumeUrl: "resume.pdf",
    email: "chestlyace@gmail.com",
    phone: "+237 676 940 247",
    whatsappNumber: "237676940247",
    location: null,
  },

  skills: [
    { name: "HTML", category: "language", ...devicon("html5") },
    { name: "CSS", category: "language", ...devicon("css3") },
    { name: "JS", category: "language", ...devicon("javascript") },
    { name: "Python", category: "language", ...devicon("python") },
    { name: "C", category: "language", ...devicon("c") },
    { name: "PHP", category: "language", ...devicon("php") },
    { name: "Java", category: "language", ...devicon("java") },
    { name: "Dart", category: "language", ...devicon("dart") },
    { name: "React", category: "framework", ...devicon("react") },
    { name: "Tailwind", category: "framework", ...devicon("tailwindcss") },
    { name: "Next.js", category: "framework", ...devicon("nextjs") },
    { name: "Flutter", category: "framework", ...devicon("flutter") },
    { name: "React Native", category: "framework", ...devicon("react") },
    { name: "Node.js", category: "framework", ...devicon("nodejs") },
    { name: "Express", category: "framework", ...devicon("express") },
    { name: "Django", category: "framework", ...devicon("django") },
    { name: "BS5", category: "framework", ...devicon("bootstrap") },
    { name: "Figma", category: "tool", ...devicon("figma") },
    { name: "Git", category: "tool", ...devicon("git") },
    { name: "VS Code", category: "tool", ...devicon("vscode") },
    { name: "Linux", category: "tool", ...devicon("linux") },
    { name: "MongoDB", category: "database", ...devicon("mongodb") },
    { name: "MySQL", category: "database", ...devicon("mysql") },
    { name: "PostgreSQL", category: "database", ...devicon("postgresql") },
    { name: "Google Cloud", category: "cloud", ...devicon("googlecloud") },
    {
      name: "AWS",
      category: "cloud",
      iconSlug: null,
      iconUrl:
        "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
    },
  ],

  services: [
    {
      title: "Software Development",
      description:
        "Building robust, scalable, and efficient web and mobile applications tailored to your specific needs.",
      icon: "code",
      items: ["Full Stack Web Apps", "Mobile Applications", "API Integration"],
    },
  ],

  projects: [
    {
      slug: "alexdy",
      title: "Alexdy",
      summary:
        "Alexdy is a premium digital marketplace designed to bridge the gap between quality service providers and consumers.",
      description:
        'Alexdy is a premium digital marketplace designed to bridge the gap between quality service providers and consumers. The platform features a robust, bilingual (English/French) architecture that supports diverse categories—ranging from electronics and fashion to specialized technical services like appliance repair and beauty. I developed this platform to prioritize user trust, featuring secure checkout, service provider verification, and a streamlined "request-to-delivery" workflow.',
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuApiCSKKDhaEL-DankJ2lj73_vwRIutzB79mP2uRmBjCxMtEQa-wa6WXPy-EWcDpRbLYYPhfgxu3604B0BdWb0JCwBOMMr_mIwG6HR-e6lNOjeWt1oPk_uX3F8DLSEsB8vSWz5Rg2AvL2XDCvKiGZJUvBe_N2fMgWidenRji5TPJw9rakBBPdTgaxbaYkwxsnEoW6hSPYnQsOq8W0lQE55SQDyAnUt7HYkroQo21ZZm3XABn_EDYWtjn7yvK9hqOqpYOySQ0tlkHxY2",
      techStack: ["Laravel", "PHP", "Tailwind", "MySQL"],
      categoryLabel: "Full Stack",
      liveUrl: "https://alexdy.com",
      sourceUrl: null,
    },
    {
      slug: "lens-and-life",
      title: "Lens & Life",
      summary:
        "A social platform for street photographers to share locations and stories.",
      description:
        "A social platform for street photographers to share locations and stories. Built with React Native for cross-platform performance.",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB6te8U5OVZAqYh25V48LtpKpKMpSkRxNlUl363FdQA4X8bRAwV0oP2zbidMfVSnVw_kbFZvtl_DHsVTTBfz5a7iaEJkZTVHbXnIwoW8hZyR-uv4LX6Hxjv4h_11aMWBhpt-RQxHbO8odiBQpT401fUub7GDK4n-1WYzmW2RHb_-otF4_Woh00IDTO09INtfY0iMCQMCWPjrVv6eHDLxdalAQwgaChPKb8iDgJkQpul51FGRhegK1f6kfszksS3hVYqhrqFjlWpdbJu",
      techStack: ["React Native", "Firebase", "Google Maps API"],
      categoryLabel: "Mobile App",
      liveUrl: null,
      sourceUrl: null,
    },
  ],

  // Year-only dates are stored as January 1st; dates_label keeps the original text.
  journey: [
    {
      type: "work",
      role: "Backend Developer(Intern)",
      organization: "NHA Health Tech.",
      startDate: "2025-12-01",
      endDate: null,
      datesLabel: "Dec 2025 - Present",
      description:
        "Building tech solutions for the healthcare, sector in Cameroon focusing on scalable backend architecture.",
      logoUrl: "ets_nhahealthtech_logo.jpeg",
    },
    {
      type: "work",
      role: "Software Developer",
      organization: "Digimark Consulting",
      startDate: "2025-06-01",
      endDate: null,
      datesLabel: "Jun 2025 - Present",
      description:
        "Building tech solutions for clients, focusing on scalable backend architecture.",
      logoUrl: "digimark.jpeg",
    },
    {
      type: "education",
      role: "Bachelor's Degree",
      organization: "Yaounde Int. Business School",
      startDate: "2025-01-01",
      endDate: null,
      datesLabel: "2025 - Present",
      description:
        "Continuing advanced studies in Software Engineering and Business.",
      logoUrl: "yibs.png",
    },
    {
      type: "work",
      role: "Frontend Developer",
      organization: "NGCodeX",
      startDate: "2024-09-01",
      endDate: "2024-10-01",
      datesLabel: "Sep 2024 - Oct 2024",
      description:
        "Developed responsive and interactive UI for hospital consultation systems.",
      logoUrl: "logoNGcodeX.png",
    },
    {
      type: "work",
      role: "Software Developer (Intern)",
      organization: "Camsoft Group sarl.",
      startDate: "2024-07-01",
      endDate: "2024-09-01",
      datesLabel: "Jul 2024 - Sep 2024",
      description:
        "Worked on building responsive web apps using React, Tailwind, and Modern JS.",
      logoUrl: null,
    },
    {
      type: "education",
      role: "HND in Software Engineering",
      organization: "University Institute of Sci. & Tech.",
      startDate: "2023-01-01",
      endDate: "2025-01-01",
      datesLabel: "2023 - 2025",
      description:
        "Foundation in computer science, software engineering and web development.",
      logoUrl: null,
    },
  ],

  // Name and issuer as printed on each badge. Display order is the order here.
  certifications: [
    ["Introduction to Generative AI", "Google Cloud", "intro-generative-ai"],
    [
      "Introduction to Large Language Models",
      "Google Cloud",
      "intro-large-language-models",
    ],
    ["Introduction to Responsible AI", "Google Cloud", "intro-responsible-ai"],
    ["Google Cloud Essentials", "Google Cloud", "google-cloud-essentials"],
    [
      "Introduction to Gemini for Google Workspace",
      "Google Workspace",
      "intro-gemini-google-workspace",
    ],
    ["Gemini in Gmail", "Google Workspace", "gemini-in-gmail"],
    ["Gemini in Google Docs", "Google Workspace", "gemini-in-google-docs"],
  ].map(([name, issuer, file]) => ({
    name,
    issuer,
    issuedOn: null,
    badgeUrl: `/certs/${file}.png`,
    credentialUrl: null,
  })),

  socials: [
    {
      platform: "Instagram",
      url: "https://instagram.com/chestlyace",
      icon: "instagram",
    },
    {
      platform: "LinkedIn",
      url: "https://linkedin.com/in/chestlyace",
      icon: "linkedin",
    },
    {
      platform: "GitHub",
      url: "https://github.com/chestlyace",
      icon: "github",
    },
    {
      platform: "TikTok",
      url: "https://tiktok.com/@chestlyace",
      icon: "tiktok",
    },
  ],

  // The old homepage FAQ, minus the design and photography questions. "Can
  // clients hire you remotely?" still mentions design and digital content: the
  // owner rewrites it (ia-content.md §2.9).
  faqs: [
    {
      question: "What kind of software development projects do you handle?",
      answer:
        "I build responsive websites, portfolio sites, business landing pages, dashboards, and custom web applications with a focus on performance, usability, and maintainable code.",
    },
    {
      question: "Can clients hire you remotely?",
      answer:
        "Yes. I work with remote clients on web development, design, and digital content projects, with communication and delivery handled online.",
    },
  ],
} as const;

const withOrder = <T extends object>(rows: readonly T[]) =>
  rows.map((row, index) => ({ ...row, orderIndex: index + 1 }));

export async function seed(db: Database) {
  await db.transaction(async (tx) => {
    for (const table of [
      schema.faqs,
      schema.socials,
      schema.certifications,
      schema.volunteering,
      schema.journey,
      schema.projects,
      schema.services,
      schema.skills,
      schema.profile,
    ]) {
      await tx.delete(table);
    }

    await tx.insert(schema.profile).values(seedData.profile);
    await tx.insert(schema.skills).values(withOrder(seedData.skills));
    await tx
      .insert(schema.services)
      .values(
        withOrder(
          seedData.services.map((s) => ({ ...s, items: [...s.items] })),
        ),
      );
    await tx
      .insert(schema.projects)
      .values(
        withOrder(
          seedData.projects.map((p) => ({ ...p, techStack: [...p.techStack] })),
        ),
      );
    await tx.insert(schema.journey).values(withOrder(seedData.journey));
    await tx
      .insert(schema.certifications)
      .values(withOrder(seedData.certifications));
    await tx.insert(schema.socials).values(withOrder(seedData.socials));
    await tx.insert(schema.faqs).values(withOrder(seedData.faqs));
  });
}

if (import.meta.main) {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production"
  ) {
    console.error("Refusing to seed: this is a production environment.");
    process.exit(1);
  }
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Set DATABASE_URL (or DIRECT_URL) in .env.local first.");
    process.exit(1);
  }

  const { Pool } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const pool = new Pool({ connectionString });
  try {
    await seed(drizzle(pool, { schema }));
    console.log("Seeded the database with the old site's data.");
  } finally {
    await pool.end();
  }
}
