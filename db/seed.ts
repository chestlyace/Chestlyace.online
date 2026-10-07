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

const SAMPLE_POST = `Welcome. This is a sample post that the development seed creates, so the blog has something to show; it is replaced by real posts written in the admin.

## What this blog is for

Notes on software engineering, web development, and building things. Short, practical, and written to be read in one sitting.

\`\`\`callout type=tip title="A tip"
Posts are written in the admin with simple forms. You never type the markdown you are reading here.
\`\`\`

## Code that reads well

Code is highlighted for both themes, with an optional file name, line numbers and highlighted lines:

\`\`\`ts title="proxy.ts" {2,4-5}
export function proxy(request: NextRequest) {
  const site = siteFromHost(request.headers.get("host"));
  const url = request.nextUrl.clone();
  url.pathname = \`/sites/\${site}\${url.pathname}\`;
  return NextResponse.rewrite(url);
}
\`\`\`

### A comparison

| Approach | Good for | Cost |
| --- | --- | --- |
| One app, many hosts | Shared design and deploys | A routing layer |
| One app per site | Hard isolation | Three of everything |

## The rich blocks

### Steps

\`\`\`steps
## Plan the move
icon: map
Write down what runs where, and what each piece needs from the others.
---
## Switch the host
icon: server
Point the **proxy** at the right site, then check each host with \`curl\`.
---
## Ship it
icon: rocket
Merge, deploy, and watch the [analytics](https://vercel.com/docs/analytics) for a day.
\`\`\`

### Compare

\`\`\`compare
title: One app or three
highlight: 3
| Aspect | One app per site | One app, many hosts |
| Shared design | Copied around | Built once |
| Deploys | Three pipelines | One pipeline |
| Isolation | Strong | Needs care |
\`\`\`

### A file tree

\`\`\`filetree
app/
├── sites/
│   ├── main/  # The portfolio
│   ├── blog/  # This blog
│   └── admin/  # Behind a sign-in
├── + proxy.ts  # Picks the site from the host
└── globals.css
\`\`\`

### Code that types itself

\`\`\`typewriter lang=ts title="siteFromHost.ts"
export function siteFromHost(host: string) {   // @ One function decides the site
  const name = host.split(".")[0];
  return SITES.includes(name) ? name : "main";  // @ Unknown hosts fall back to main
}
\`\`\`

### Several files

\`\`\`codegroup
--- ts proxy.ts
export const config = { matcher: "/((?!_next).*)" };
--- json package.json
{ "name": "portfolio", "private": true }
\`\`\`

### A change

\`\`\`diff lang=ts title="proxy.ts"
- const site = "main";
+ const site = siteFromHost(request.headers.get("host"));
  return NextResponse.rewrite(url);
\`\`\`

### A terminal

\`\`\`terminal title="zsh"
# Start the dev server
$ pnpm dev
ready - started server on http://localhost:3000
$ curl -I http://blog.localhost:3000
HTTP/1.1 200 OK
\`\`\`

### A diagram

\`\`\`flow
[browser|icon:globe|style:blue|pos:0,40] Browser
[proxy|icon:shuffle|style:purple|desc:Reads the host|pos:300,40] Proxy
[main|icon:house|style:green|pos:600,0] Main site
[blog|icon:book-open|style:orange|pos:600,120] Blog

browser --> proxy : request
proxy --> main : main host
proxy --> blog : blog host
\`\`\`

### A quiz

\`\`\`quiz
Q: What decides which site a request gets?
) The URL path
*) The host name
) A cookie
E: The proxy reads the **host** and rewrites to that site's folder.
---
Q: Where do the posts live?
*) In the database
) In files in the repository
E: Posts are rows in Postgres, written in the admin.
\`\`\`

## Where to next

Read the [portfolio](https://chestlyace.online), or follow the feed from the footer.
`;

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
    heroImageUrl: "/hero.webp",
    aboutQuote:
      "Blending logic with creativity to craft digital experiences that matter.",
    // PLACEHOLDER — a software-only draft, until the owner writes their own
    // (Q5). The old text described "a multi-disciplinary creative".
    aboutBody: [
      "I'm Chestly, a software engineer who builds fast, reliable products for the web. My journey started with curiosity about how things work, and I've been building backends, interfaces, and everything in between ever since.",
      "I care about clear problems, simple solutions, and code that stays easy to change. Whether it's an API, a dashboard, or a mobile app, my goal is the same: ship something people can rely on.",
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

  // PLACEHOLDER — the four starting services from ia-content.md §2.4, with
  // descriptions written by the agent until the owner supplies their wording.
  // Icons are Iconly names (design.md §6).
  services: [
    {
      title: "Web Applications",
      description:
        "Full-stack web applications, from dashboards to custom interfaces, built to be fast and easy to change.",
      icon: "Category",
      items: ["Full-stack web apps", "Dashboards", "Custom interfaces"],
    },
    {
      title: "Websites & Landing Pages",
      description:
        "Business websites, landing pages, and portfolio sites that load fast, work on every screen, and are built to convert.",
      icon: "Document",
      items: [
        "Business websites",
        "Landing pages",
        "Portfolio sites",
        "Fast and responsive",
      ],
    },
    {
      title: "Backend & APIs",
      description:
        "Reliable backends: clean APIs, well-designed databases, and architecture that scales with the product.",
      icon: "Setting",
      items: [
        "API design and integration",
        "Databases",
        "Scalable backend architecture",
      ],
    },
    {
      title: "Mobile Apps",
      description:
        "Cross-platform mobile apps that feel native, shipped from a single codebase.",
      icon: "Call",
      items: ["Flutter", "React Native"],
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
      logoUrl: "logos/ets_nhahealthtech_logo.jpeg",
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
      logoUrl: "logos/digimark.jpeg",
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
      logoUrl: "logos/yibs.png",
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
      logoUrl: "logos/logoNGcodeX.png",
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

  // A sample post so the blog has something to show in development (the real
  // ones are written in the admin).
  blogPosts: [
    {
      slug: "hello-world",
      title: "Hello, world",
      description:
        "A sample post showing what the blog can do: prose, highlighted code, a callout, a table and every rich block.",
      content: SAMPLE_POST,
      tags: ["meta", "web"],
      status: "published",
      publishedAt: new Date("2026-10-07T09:00:00Z"),
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
      schema.blogPosts,
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
    await tx
      .insert(schema.blogPosts)
      .values(
        seedData.blogPosts.map((post) => ({ ...post, tags: [...post.tags] })),
      );
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
