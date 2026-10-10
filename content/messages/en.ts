// The English dictionary (docs/i18n.md §4): the source of the message shape. Every
// string a visitor reads that is written in code lives here (the main site and the
// chrome since Phase 11b.2; the blog and Creatives follow in 11b.4 and 11b.5);
// `fr.ts` must have the same keys, which the type enforces and `messages.test.ts`
// checks. Placeholders are `{name}`.
//
// PLACEHOLDER COPY — as before, the wording written by the agent (not yet the
// owner's) is marked in design.md §13–14; replace it here, nothing else changes.
export const en = {
  language: {
    label: "Language",
    /** The name of each language, in itself. */
    names: { en: "English", fr: "Français" },
    /** The switcher's accessible name for a language, e.g. "Switch to Français". */
    switchTo: "Switch to {language}",
  },

  // The header, the footer and everything every page has (design.md §13.6–13.9).
  chrome: {
    skipToContent: "Skip to content",
    brandHome: "Chestly Ace — home",
    menuOpen: "Open menu",
    menuClose: "Close menu",
    mainNav: "Main",
    menuNav: "Menu",
    sites: "Sites",
    youAreHere: "You’re here",
    /** The hint of a link to another of the sites, e.g. "opens the Blog site". */
    opensSite: "opens the {site} site",
    siteNames: { main: "Dev", creatives: "Creatives", blog: "Blog" },
    // PLACEHOLDER — one line under each site in the Sites menu (design.md §13.7).
    siteDescriptions: {
      main: "Software engineering",
      creatives: "Design and photography",
      blog: "Writing and notes",
    },
    // PLACEHOLDER — the one-line description in the footer's brand block
    // (design.md §13.8, D26).
    footerDescriptions: {
      main: "Software engineer building fast, reliable products for the web.",
      creatives: "Design and photography by Chestly Ace.",
      blog: "Writing and notes from Chestly Ace.",
    },
    /** The main site's key links (the other sites' are with their own steps). */
    nav: {
      about: "About",
      projects: "Projects",
      experience: "Experience",
      contact: "Contact",
    },
    footer: {
      nav: "Footer",
      sites: "Sites",
      connect: "Connect",
      contact: "Contact",
      backToTop: "Back to top",
      copyright: "© {year} Chestly Ace",
      resume: "Resume",
      whatsapp: "WhatsApp",
    },
    theme: {
      label: "Theme",
      states: { system: "System", light: "Light", dark: "Dark" },
      /** e.g. "Theme: System. Switch to Light." */
      switch: "Theme: {current}. Switch to {next}.",
    },
    notFound: "404 — page not found",
    /** The words the footer's particles spell (design.md §13.61). */
    wordmark: {
      developer: "DEVELOPER",
      designer: "DESIGNER",
      photographer: "PHOTOGRAPHER",
    },
  },

  // The coming-soon page of a site with nothing published yet (design.md §14.12).
  comingSoon: {
    label: "Coming soon",
    button: "Visit chestlyace.online",
    creatives: {
      title: "Design & Photography",
      lead: "Graphic design, branding, and photography by Chestly Ace (Amahndong Chestly). A new home for the work is on its way.",
    },
    blog: {
      title: "Blog",
      lead: "Writing on software engineering, web development, and building things. The first posts are on their way.",
    },
  },

  // The main site's homepage (design.md §14.1–14.9).
  home: {
    unavailable: "Portfolio content isn’t loaded yet.",
    timelineNow: "NOW",
    hero: {
      viewProjects: "View Projects",
      getInTouch: "Get In Touch",
      scrollToAbout: "Scroll to About",
      verified: "Verified",
      // PLACEHOLDER — the tagline under the headline (design.md §14.1). Software only.
      tagline: "Software engineer crafting modern digital experiences.",
      /** The paragraph; `{who}` is the name, or "Legal Name, known professionally as Name,". */
      intro: "{who} builds fast, reliable websites and web applications.",
      introKnownAs: "{legalName}, known professionally as {name},",
      /** The headline's screen-reader text: "Name, also known as Legal Name — headline". */
      alsoKnownAs: ", also known as {legalName}",
      // PLACEHOLDER — the speech-bubble quote card next to the portrait.
      quote: {
        handle: "@Dev.Ace",
        text: "Chill and relax, it's the weekend. Not you devs, go complete your client's projects.",
      },
    },
    about: {
      label: "About",
      title: "About me",
      download: "Download Resume",
      basedIn: "Based in",
      role: "Role",
      status: "Status",
    },
    skills: {
      label: "Skills",
      title: "Skills",
      certifications: "Certifications",
      groups: {
        language: "Languages",
        framework: "Frameworks",
        database: "Databases",
        cloud: "Cloud & DevOps",
        tool: "Tools",
      },
      verifyCredential: "verify credential",
    },
    services: {
      label: "Services",
      title: "Services",
      // PLACEHOLDER — the intro under the Services heading (ia-content.md §2.4).
      intro:
        "I help businesses, founders, and teams launch responsive websites and custom web applications, with attention to performance, maintainable code, and clean delivery.",
      // PLACEHOLDER — the Creatives card that ends the service stack (design.md §13.12).
      creativesCard: {
        label: "Creatives",
        title: "Design & photography live on Creatives",
        line: "Looking for design or photography? See my creative work.",
        hint: "opens the Creatives site",
      },
    },
    projects: { label: "Projects", title: "Projects", view: "View" },
    experience: {
      label: "Experience",
      title: "Experience",
      education: "Education",
    },
    volunteering: {
      label: "Volunteering",
      title: "Volunteering",
      // PLACEHOLDER — the intro under the Volunteering heading (design.md §14.7).
      intro: "Time given to communities and causes outside of paid work.",
    },
    contact: {
      label: "Contact",
      // PLACEHOLDER — the heading carries over from the old site (design.md §14.8).
      heading: "Let's work together",
      intro: "Have a project in mind? Let's create something extraordinary.",
      formTitle: "Send a message",
      social: "Social links",
      tiles: {
        email: "Email",
        phone: "Phone",
        whatsapp: "WhatsApp",
        chat: "Chat on WhatsApp",
        copyEmail: "Copy email address",
        emailCopied: "Email address copied",
        copyPhone: "Copy phone number",
        phoneCopied: "Phone number copied",
        copied: "Copied",
      },
      qr: {
        label: "WhatsApp QR code",
        description: "QR code that opens a WhatsApp chat",
        scan: "Scan to connect",
      },
      form: {
        label: "Contact form",
        name: "Name",
        email: "Email",
        subject: "Subject",
        subjectPlaceholder: "Choose a subject",
        message: "Message",
        website: "Website",
        send: "Send message",
        sending: "Sending…",
        /** The subjects keep their English value for the email you receive; this is what is shown. */
        subjects: {
          "General Inquiry": "General Inquiry",
          "Web Development Project": "Web Development Project",
          "Job Opportunity": "Job Opportunity",
          Collaboration: "Collaboration",
        },
        errors: {
          nameRequired: "Enter your name.",
          nameTooLong: "That name is too long.",
          emailRequired: "Enter your email address.",
          emailInvalid: "Enter a valid email address, like name@example.com.",
          subjectInvalid: "Choose what this is about.",
          messageRequired: "Write a message.",
          messageShort: "Add a little more detail (at least 10 characters).",
          messageLong:
            "That message is too long. Keep it under 5,000 characters.",
        },
        // PLACEHOLDER — the thank-you panel and the error messages (design.md §13.15).
        success: {
          title: "Message sent",
          text: "Thanks for reaching out. I'll reply by email as soon as I can.",
          whatsapp: "Continue on WhatsApp",
        },
        failures: {
          failed:
            "Your message didn't go through. Please try again, or use the email or WhatsApp links.",
          rateLimited:
            "You've sent a few messages already. Please try again a little later, or use the email or WhatsApp links.",
        },
        /** The first message of the WhatsApp chat the thank-you panel offers. */
        whatsappMessage: "Hi Chestly, it's {name}. {subject}: {message}",
      },
    },
    faq: { label: "FAQ", title: "FAQ" },
  },

  // A project's page (design.md §14.10).
  project: {
    back: "All projects",
    next: "Next project",
    gallery: "Gallery",
    preview: "{title} — project preview",
    screenshot: "{title} — screenshot {n}",
    privateLink: "{label} · Private",
    live: "Live",
    source: "Source",
    caseStudy: {
      problem: "Problem",
      approach: "Approach",
      outcome: "Outcome",
      overview: "Overview",
    },
  },

  // The titles and descriptions search engines and shared links show (docs/i18n.md §6).
  seo: {
    main: {
      title: "{name} ({legalName}) — Software Engineer",
      description:
        "{name} ({legalName}) is a software engineer building fast, reliable web applications, backends, and APIs. Open to remote roles.",
      jobTitle: "Software Engineer",
    },
    project: "{title} — Chestly Ace",
  },
};

export type Messages = typeof en;
