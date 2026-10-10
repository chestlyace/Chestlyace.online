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
      /** The blog's key links. */
      posts: "Posts",
      tags: "Tags",
      /** The creatives site's key links. */
      work: "Work",
      design: "Design",
      photography: "Photography",
      services: "Services",
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

  // The blog (design.md §13.27–13.37, §14.13–14.18).
  blog: {
    footer: { privacy: "Privacy", rss: "RSS" },
    home: {
      label: "Blog",
      title: "Blog",
      intro:
        "Writing on software engineering, web development, and building things.",
    },
    /** The date and the reading time in a post's mono meta line. */
    meta: {
      minRead: "{minutes} MIN READ",
      minuteRead: {
        one: "{count} minute read",
        other: "{count} minute read",
      },
      updated: "UPDATED",
    },
    /** A post that has no version in the page's language (French blog, English post). */
    onlyEnglish: {
      mark: "EN",
      markLabel: "In English",
      notice: "This article is only available in English.",
    },
    post: {
      allPosts: "All posts",
      tags: "Tags",
      moreLabel: "More posts",
      previous: "Previous",
      next: "Next",
      previousPost: "Previous post: {title}",
      nextPost: "Next post: {title}",
      onThisPage: "On this page",
      title: "{title} — Chestly Ace",
    },
    tags: {
      label: "Tags",
      title: "Tags",
      intro: "Browse posts by topic.",
      listLabel: "Tags",
      tagLabel: "Tag",
      allTags: "All tags",
      posts: { one: "{count} post", other: "{count} posts" },
      pageTitle: "Tags — Chestly Ace",
      pageDescription: "Browse the blog's posts by topic.",
      tagTitle: "Posts tagged {tag} — Chestly Ace",
      tagDescription: "Posts on the blog tagged {tag}.",
    },
    reactions: {
      like: "Like this post",
      likes: { one: "{count} like", other: "{count} likes" },
    },
    share: {
      share: "Share",
      menu: "Share this post",
      copyLink: "Copy link",
      linkCopied: "Link copied",
      onX: "Share on X",
      onLinkedIn: "Share on LinkedIn",
      onWhatsApp: "Share on WhatsApp",
      byEmail: "Share by email",
    },
    comments: {
      title: "Comments",
      signedInAs: "Signed in as",
      signOut: "Sign out",
      deleteAccount: "Delete my account",
      loading: "Loading comments",
      loadError: "Comments couldn't load.",
      tryAgain: "Try again",
      none: "No comments yet. Be the first.",
      loadMore: "Load more comments",
      removed: "This comment was removed.",
      author: "AUTHOR",
      commentBy: "Comment by {name}",
      likeComment: "Like this comment",
      likes: { one: "{count} like", other: "{count} likes" },
      reply: "Reply",
      report: "Report",
      reported: "Reported",
      delete: "Delete",
      cancel: "Cancel",
      close: "Close",
      repliesTo: "Replies to {name}",
      repliesToRemoved: "Replies to a removed comment",
      showReplies: "Show {count} replies",
      justNow: "just now",
      addComment: "Add a comment",
      addReply: "Add a reply",
      words: "{count} / {max} words",
      post: "Post comment",
      signInEnded: "Your sign-in ended. Please sign in again.",
      forbidden: "You can't comment here.",
      slowDown: "Slow down a little, then try again.",
      failed: "That didn't work. Please try again.",
      offline: "Couldn't reach the server. Check your connection.",
      reportDone: "Reported. Thank you.",
      reportFailed: "Couldn't send that. Please try again.",
      deleteFailed: "Couldn't delete that. Please try again.",
      reportTitle: "Report this comment?",
      reportText:
        "The owner is told and will take a look. Each reader can report a comment once.",
      deleteTitle: "Delete your comment?",
      deleteWithReplies:
        "It will read “This comment was removed.” so the replies keep their place.",
      deleteForGood: "It is removed for good.",
      deleteAccountTitle: "Delete your account?",
      deleteAccountText:
        "Your account and your sign-in are removed. Your comments stay, shown as “Deleted user”, and your likes on comments go.",
      deleteAccountFailed:
        "That didn't work. Sign out, sign in again, and try once more.",
      deletedUser: "Deleted user",
      invalid: {
        empty: "Write something first.",
        tooLong: "That comment is too long.",
        tooManyWords: "Keep it to {max} words or fewer (it is {words}).",
        noParent: "That comment isn't there to reply to.",
        duplicate: "You've already posted that.",
        ownComment: "You can't report your own comment.",
      },
    },
    signIn: {
      title: "Sign in to comment",
      text: "We use your name and picture from GitHub or Google. Your email is never shown.",
      privacy: "Privacy",
      failed: "Sign-in didn't complete. Please try again.",
      unavailable: "Sign-in isn't available yet.",
      github: "Continue with GitHub",
      google: "Continue with Google",
    },
    newsletter: {
      region: "Newsletter",
      email: "Email",
      subscribe: "Subscribe",
      website: "Website",
      pageTitle: "Newsletter — Chestly Ace",
    },
    // The newsletter's wording as first written. The owner edits it in the admin
    // (Blog → Newsletter), in both languages; these are what a field shows until it
    // is changed, and what a blank one falls back to (lib/newsletterCopy.ts).
    // PLACEHOLDER — the box and the page were approved with the Phase 9a spec; the
    // confirmation email is a DRAFT (9b.7).
    newsletterDefaults: {
      boxLabel: "Newsletter",
      boxTitle: "New posts, in your inbox",
      boxText: "A short email when I publish something new. Nothing else.",
      boxHelper:
        "You can unsubscribe at any time. Prefer a feed? Use the RSS link in the footer.",
      boxSuccess:
        "Check your inbox. I've sent you a link to confirm your address.",
      boxError: "That didn't work. Please try again in a moment.",
      boxInvalid: "Enter a valid email address.",
      boxRateLimited:
        "Too many tries from here. Please try again a little later.",
      confirmedLabel: "Subscribed",
      confirmedTitle: "You're on the list",
      confirmedLead:
        "Thanks for confirming. You'll get an email when there's a new post.",
      confirmedButton: "Read the blog",
      failedLabel: "Link expired",
      failedTitle: "That link didn't work",
      failedLead:
        "It may have expired or already been used. You can subscribe again from the bottom of any post.",
      failedButton: "Go to the blog",
      emailSubject: "Confirm your subscription to the Chestly Ace blog",
      emailIntro:
        "Thanks for subscribing to new posts from the Chestly Ace blog.",
      emailAction: "Confirm my subscription",
      emailExpires: "This link works for 48 hours.",
      emailIgnore:
        "If you didn't ask for this, just ignore this email. Nobody is subscribed until the link is opened.",
    },
    privacy: {
      label: "Privacy",
      title: "Privacy",
      pageTitle: "Privacy — Chestly Ace",
      description: "What the blog stores about readers, and why.",
      updatedLabel: "Last updated {date}",
      /** ISO date of the last change to the text below (update it with the text). */
      updated: "2026-10-08",
      // DRAFT WORDING for the owner's approval (design.md §14.18, Phase 9b.5b).
      // `{contact}` is the contact form's address.
      text: `
This blog keeps very little about you. This page says what, and why.

## What is stored

- **Likes.** When you like a post, your browser gets a cookie called \`blog_visitor\` holding a random code. I keep only a scrambled (hashed) copy of it next to the post, so a like counts once. It can't be turned back into the code, and it says nothing about who you are.
- **Your account, if you sign in to comment.** GitHub or Google shares your **name, email address and profile picture** with me, and I store them. A sign-in cookie (\`reader.session_token\`) keeps you signed in for up to 30 days.
- **Your comments**, the likes you give to comments, and any comments you report.
- **Newsletter.** If you subscribe, I keep your **email address** in Resend, the email service I send the newsletter with. It is not stored in this blog's own database. I only add it after you open the link in the confirmation email; if you never do, it is not kept.

## Why

To make likes count once, to let you comment, to keep you signed in, to email you new posts if you subscribe, and so I can tell who wrote what and deal with spam or abuse. Nothing is used for advertising, and nothing is sold.

## Who sees it

- Your **name, picture and comments are public**, next to your comments.
- Your **email address is never shown** to other readers. Only I can see it. The same goes for a newsletter address: only I and Resend see it, and I never share the list.
- When someone comments, I get an email with their name and their comment (not their email address). The site runs on Vercel, with its database and the email service Resend, which handle this data for me.

## How long

- The likes cookie lasts a year.
- A sign-in lasts up to 30 days.
- Your account and comments stay until you delete them or I remove them.
- A newsletter address stays until you unsubscribe.

## Deleting your data

Sign in, open the menu on your name under the comments, and choose **Delete my account**. That removes your name, email address, picture, sign-in and your likes on comments. Your comments stay, shown as "Deleted user"; you can delete each of them yourself first. Every newsletter email has an unsubscribe link, which stops the emails. If you would like your address removed from the list altogether, or anything else removed, ask me.

## Questions

Use the [contact form]({contact}) on my main site.
`,
    },
  },

  // The titles and descriptions search engines and shared links show (docs/i18n.md §6).
  // The creatives site's wording as first written. The owner edits it in the admin
  // (Creatives → Settings), in both languages; these are what a field shows until it
  // is changed, and what a blank one falls back to (lib/creativesCopy.ts).
  // PLACEHOLDER — design.md §14.20–14.26.
  creativesDefaults: {
    heroStatement: "Design & Photography",
    heroLine:
      "Brand visuals and event stories by Chestly Ace (Amahndong Chestly).",
    designIntro:
      "Logos, posters, social campaigns and brand visuals made to look intentional.",
    photographyIntro:
      "Events, portraits and brand stories, from the moments worth keeping.",
    portalsTitle: "Two ways I work",
    portalDesignText: "Brand identity, posters and campaign visuals.",
    portalPhotographyText: "Events and portraits, told in pictures.",
    marqueeWords: ["Graphic design", "Photography", "Branding", "Events"],
    contactStatement: "Have a project or an event to cover?",
    contactText:
      "Tell me what you have in mind and I'll get back to you with ideas and a quote.",
    contactNote: "I usually reply within a day.",
    seoDescription:
      "Graphic design, branding, and photography by Chestly Ace (Amahndong Chestly).",
  },

  seo: {
    main: {
      title: "{name} ({legalName}) — Software Engineer",
      description:
        "{name} ({legalName}) is a software engineer building fast, reliable web applications, backends, and APIs. Open to remote roles.",
      jobTitle: "Software Engineer",
    },
    project: "{title} — Chestly Ace",
    creatives: {
      title: "Chestly Ace — Design & Photography",
      description:
        "Graphic design, branding, and photography by Chestly Ace (Amahndong Chestly).",
    },
    blog: {
      title: "Chestly Ace — Blog",
      description:
        "Writing on software engineering, web development, and building things.",
    },
  },
};

export type Messages = typeof en;
