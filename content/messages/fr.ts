import type { Messages } from "./en";

// The French dictionary (docs/i18n.md §4, §9): typed as the English shape, so a missing
// key does not compile. The voice is first person ("je"), with "vous" for the visitor;
// forms of address that depend on the owner's gender are avoided on purpose. French
// punctuation takes a no-break space before : ; ? ! (written   here).
export const fr: Messages = {
  language: {
    label: "Langue",
    names: { en: "English", fr: "Français" },
    switchTo: "Passer en {language}",
  },

  chrome: {
    skipToContent: "Aller au contenu",
    brandHome: "Chestly Ace — accueil",
    menuOpen: "Ouvrir le menu",
    menuClose: "Fermer le menu",
    mainNav: "Principale",
    menuNav: "Menu",
    sites: "Sites",
    youAreHere: "Vous êtes ici",
    opensSite: "ouvre le site {site}",
    siteNames: { main: "Dev", creatives: "Créations", blog: "Blog" },
    siteDescriptions: {
      main: "Ingénierie logicielle",
      creatives: "Design et photographie",
      blog: "Écrits et notes",
    },
    footerDescriptions: {
      main: "Ingénierie logicielle : des produits web rapides et fiables.",
      creatives: "Design et photographie par Chestly Ace.",
      blog: "Écrits et notes de Chestly Ace.",
    },
    nav: {
      about: "À propos",
      projects: "Projets",
      experience: "Expérience",
      contact: "Contact",
    },
    footer: {
      nav: "Pied de page",
      sites: "Sites",
      connect: "Réseaux",
      contact: "Contact",
      backToTop: "Haut de page",
      copyright: "© {year} Chestly Ace",
      resume: "CV",
      whatsapp: "WhatsApp",
    },
    theme: {
      label: "Thème",
      states: { system: "Système", light: "Clair", dark: "Sombre" },
      switch: "Thème : {current}. Passer à {next}.",
    },
    notFound: "404 — page introuvable",
    wordmark: {
      developer: "DÉVELOPPEUR",
      designer: "DESIGNER",
      photographer: "PHOTOGRAPHE",
    },
  },

  comingSoon: {
    label: "Bientôt disponible",
    button: "Visiter chestlyace.online",
    creatives: {
      title: "Design & photographie",
      lead: "Design graphique, identité visuelle et photographie par Chestly Ace (Amahndong Chestly). Un nouvel espace pour ces réalisations arrive bientôt.",
    },
    blog: {
      title: "Blog",
      lead: "Des écrits sur l’ingénierie logicielle, le développement web et la fabrication de produits. Les premiers articles arrivent bientôt.",
    },
  },

  home: {
    unavailable: "Le contenu du portfolio n’est pas encore chargé.",
    timelineNow: "AUJOURD’HUI",
    hero: {
      viewProjects: "Voir les projets",
      getInTouch: "Me contacter",
      scrollToAbout: "Aller à la section À propos",
      verified: "Vérifié",
      tagline: "Ingénierie logicielle : des expériences numériques modernes.",
      intro:
        "{who} conçoit des sites web et des applications web rapides et fiables.",
      introKnownAs: "{legalName}, alias {name},",
      alsoKnownAs: ", alias {legalName}",
      quote: {
        handle: "@Dev.Ace",
        text: "Détendez-vous, c’est le week-end. Pas vous, les devs : allez finir les projets de vos clients.",
      },
    },
    about: {
      label: "À propos",
      title: "À propos de moi",
      download: "Télécharger mon CV",
      basedIn: "Lieu",
      role: "Rôle",
      status: "Statut",
    },
    skills: {
      label: "Compétences",
      title: "Compétences",
      certifications: "Certifications",
      groups: {
        language: "Langages",
        framework: "Frameworks",
        database: "Bases de données",
        cloud: "Cloud & DevOps",
        tool: "Outils",
      },
      verifyCredential: "vérifier l’attestation",
    },
    services: {
      label: "Services",
      title: "Services",
      intro:
        "J’aide les entreprises, les fondateurs et les équipes à lancer des sites web responsives et des applications web sur mesure, avec une attention particulière à la performance, à la maintenabilité du code et à une livraison propre.",
      creativesCard: {
        label: "Créations",
        title: "Design et photographie : rendez-vous sur Créations",
        line: "Vous cherchez du design ou de la photographie ? Découvrez mes réalisations créatives.",
        hint: "ouvre le site Créations",
      },
    },
    projects: { label: "Projets", title: "Projets", view: "Voir" },
    experience: {
      label: "Expérience",
      title: "Expérience",
      education: "Formation",
    },
    volunteering: {
      label: "Bénévolat",
      title: "Bénévolat",
      intro:
        "Du temps donné à des communautés et à des causes, en dehors du travail rémunéré.",
    },
    contact: {
      label: "Contact",
      heading: "Travaillons ensemble",
      intro: "Un projet en tête ? Créons quelque chose d’extraordinaire.",
      formTitle: "Envoyer un message",
      social: "Réseaux sociaux",
      tiles: {
        email: "E-mail",
        phone: "Téléphone",
        whatsapp: "WhatsApp",
        chat: "Discuter sur WhatsApp",
        copyEmail: "Copier l’adresse e-mail",
        emailCopied: "Adresse e-mail copiée",
        copyPhone: "Copier le numéro de téléphone",
        phoneCopied: "Numéro de téléphone copié",
        copied: "Copié",
      },
      qr: {
        label: "Code QR WhatsApp",
        description: "Code QR qui ouvre une conversation WhatsApp",
        scan: "Scannez pour discuter",
      },
      form: {
        label: "Formulaire de contact",
        name: "Nom",
        email: "E-mail",
        subject: "Objet",
        subjectPlaceholder: "Choisissez un objet",
        message: "Message",
        website: "Site web",
        send: "Envoyer le message",
        sending: "Envoi…",
        subjects: {
          "General Inquiry": "Demande générale",
          "Web Development Project": "Projet de développement web",
          "Job Opportunity": "Opportunité d’emploi",
          Collaboration: "Collaboration",
        },
        errors: {
          nameRequired: "Indiquez votre nom.",
          nameTooLong: "Ce nom est trop long.",
          emailRequired: "Indiquez votre adresse e-mail.",
          emailInvalid:
            "Saisissez une adresse e-mail valide, par exemple nom@exemple.com.",
          subjectInvalid: "Choisissez l’objet de votre message.",
          messageRequired: "Écrivez un message.",
          messageShort:
            "Ajoutez un peu plus de détails (10 caractères au minimum).",
          messageLong:
            "Ce message est trop long. Gardez-le sous 5 000 caractères.",
        },
        success: {
          title: "Message envoyé",
          text: "Merci de m’avoir écrit. Je vous répondrai par e-mail dès que possible.",
          whatsapp: "Continuer sur WhatsApp",
        },
        failures: {
          failed:
            "Votre message n’a pas pu être envoyé. Veuillez réessayer, ou utilisez les liens e-mail ou WhatsApp.",
          rateLimited:
            "Vous avez déjà envoyé plusieurs messages. Veuillez réessayer un peu plus tard, ou utilisez les liens e-mail ou WhatsApp.",
        },
        whatsappMessage: "Bonjour Chestly, c’est {name}. {subject} : {message}",
      },
    },
    faq: { label: "FAQ", title: "FAQ" },
  },

  project: {
    back: "Tous les projets",
    next: "Projet suivant",
    gallery: "Galerie",
    preview: "{title} — aperçu du projet",
    screenshot: "{title} — capture d’écran {n}",
    privateLink: "{label} · Privé",
    live: "En ligne",
    source: "Code source",
    caseStudy: {
      problem: "Problème",
      approach: "Approche",
      outcome: "Résultat",
      overview: "Aperçu",
    },
  },

  seo: {
    main: {
      title: "{name} ({legalName}) — Ingénierie logicielle",
      description:
        "{name} ({legalName}) conçoit des applications web, des back-ends et des API rapides et fiables. Missions à distance bienvenues.",
      jobTitle: "Ingénieur logiciel",
    },
    project: "{title} — Chestly Ace",
  },
};
