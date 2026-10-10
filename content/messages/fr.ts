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
    suggestion: {
      region: "Langue",
      text: "Ce site est aussi disponible en français.",
      link: "Voir en français",
      close: "Fermer",
    },
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
      posts: "Articles",
      tags: "Thèmes",
      work: "Réalisations",
      design: "Design",
      photography: "Photographie",
      services: "Services",
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

  // Le blog (design.md §13.27–13.37, §14.13–14.18).
  blog: {
    footer: { privacy: "Confidentialité", rss: "RSS" },
    home: {
      label: "Blog",
      title: "Blog",
      intro:
        "Des écrits sur l’ingénierie logicielle, le développement web et la fabrication de produits.",
    },
    meta: {
      minRead: "{minutes} MIN DE LECTURE",
      minuteRead: {
        one: "{count} minute de lecture",
        other: "{count} minutes de lecture",
      },
      updated: "MIS À JOUR LE",
    },
    onlyEnglish: {
      mark: "EN",
      markLabel: "En anglais",
      notice: "Cet article n’est disponible qu’en anglais.",
    },
    post: {
      allPosts: "Tous les articles",
      tags: "Thèmes",
      moreLabel: "Autres articles",
      previous: "Précédent",
      next: "Suivant",
      previousPost: "Article précédent : {title}",
      nextPost: "Article suivant : {title}",
      onThisPage: "Sur cette page",
      title: "{title} — Chestly Ace",
    },
    tags: {
      label: "Thèmes",
      title: "Thèmes",
      intro: "Parcourez les articles par thème.",
      listLabel: "Thèmes",
      tagLabel: "Thème",
      allTags: "Tous les thèmes",
      posts: { one: "{count} article", other: "{count} articles" },
      pageTitle: "Thèmes — Chestly Ace",
      pageDescription: "Parcourez les articles du blog par thème.",
      tagTitle: "Articles sur le thème {tag} — Chestly Ace",
      tagDescription: "Les articles du blog sur le thème {tag}.",
    },
    reactions: {
      like: "Aimer cet article",
      likes: { one: "{count} j’aime", other: "{count} j’aime" },
    },
    share: {
      share: "Partager",
      menu: "Partager cet article",
      copyLink: "Copier le lien",
      linkCopied: "Lien copié",
      onX: "Partager sur X",
      onLinkedIn: "Partager sur LinkedIn",
      onWhatsApp: "Partager sur WhatsApp",
      byEmail: "Partager par e-mail",
    },
    comments: {
      title: "Commentaires",
      signedInAs: "Compte connecté :",
      signOut: "Se déconnecter",
      deleteAccount: "Supprimer mon compte",
      loading: "Chargement des commentaires",
      loadError: "Les commentaires n’ont pas pu se charger.",
      tryAgain: "Réessayer",
      none: "Aucun commentaire pour l’instant. Ouvrez la discussion.",
      loadMore: "Charger d’autres commentaires",
      removed: "Ce commentaire a été supprimé.",
      author: "AUTEUR",
      commentBy: "Commentaire de {name}",
      likeComment: "Aimer ce commentaire",
      likes: { one: "{count} j’aime", other: "{count} j’aime" },
      reply: "Répondre",
      report: "Signaler",
      reported: "Signalé",
      delete: "Supprimer",
      cancel: "Annuler",
      close: "Fermer",
      repliesTo: "Réponses à {name}",
      repliesToRemoved: "Réponses à un commentaire supprimé",
      showReplies: "Afficher les {count} réponses",
      justNow: "à l’instant",
      addComment: "Ajouter un commentaire",
      addReply: "Ajouter une réponse",
      words: "{count} / {max} mots",
      post: "Publier le commentaire",
      signInEnded: "Votre connexion a pris fin. Veuillez vous reconnecter.",
      forbidden: "Vous ne pouvez pas commenter ici.",
      slowDown: "Doucement : patientez un instant, puis réessayez.",
      failed: "Cela n’a pas fonctionné. Veuillez réessayer.",
      offline: "Impossible de joindre le serveur. Vérifiez votre connexion.",
      reportDone: "Signalé. Merci.",
      reportFailed: "L’envoi a échoué. Veuillez réessayer.",
      deleteFailed: "La suppression a échoué. Veuillez réessayer.",
      reportTitle: "Signaler ce commentaire ?",
      reportText:
        "Le propriétaire du blog est prévenu et y jettera un œil. Chaque lecteur peut signaler un commentaire une seule fois.",
      deleteTitle: "Supprimer votre commentaire ?",
      deleteWithReplies:
        "Il sera remplacé par « Ce commentaire a été supprimé. » pour que les réponses gardent leur place.",
      deleteForGood: "Il sera supprimé définitivement.",
      deleteAccountTitle: "Supprimer votre compte ?",
      deleteAccountText:
        "Votre compte et votre connexion sont supprimés. Vos commentaires restent, affichés sous « Utilisateur supprimé », et vos j’aime sur les commentaires disparaissent.",
      deleteAccountFailed:
        "Cela n’a pas fonctionné. Déconnectez-vous, reconnectez-vous, puis réessayez.",
      deletedUser: "Utilisateur supprimé",
      invalid: {
        empty: "Écrivez d’abord quelque chose.",
        tooLong: "Ce commentaire est trop long.",
        tooManyWords: "Limitez-vous à {max} mots (il en compte {words}).",
        noParent: "Ce commentaire n’existe plus, impossible d’y répondre.",
        duplicate: "Vous avez déjà publié ce message.",
        ownComment: "Vous ne pouvez pas signaler votre propre commentaire.",
      },
    },
    signIn: {
      title: "Connectez-vous pour commenter",
      text: "Nous utilisons votre nom et votre photo de GitHub ou de Google. Votre adresse e-mail n’est jamais affichée.",
      privacy: "Confidentialité",
      failed: "La connexion n’a pas abouti. Veuillez réessayer.",
      unavailable: "La connexion n’est pas encore disponible.",
      github: "Continuer avec GitHub",
      google: "Continuer avec Google",
    },
    newsletter: {
      region: "Lettre d’information",
      email: "E-mail",
      subscribe: "S’abonner",
      website: "Site web",
      pageTitle: "Lettre d’information — Chestly Ace",
    },
    newsletterDefaults: {
      boxLabel: "Lettre d’information",
      boxTitle: "Les nouveaux articles, dans votre boîte mail",
      boxText: "Un court e-mail à chaque nouvelle publication. Rien d’autre.",
      boxHelper:
        "Vous pouvez vous désabonner à tout moment. Vous préférez un flux ? Utilisez le lien RSS en bas de page.",
      boxSuccess:
        "Vérifiez votre boîte de réception : un lien vous a été envoyé pour confirmer votre adresse.",
      boxError: "Cela n’a pas fonctionné. Veuillez réessayer dans un instant.",
      boxInvalid: "Saisissez une adresse e-mail valide.",
      boxRateLimited:
        "Trop d’essais depuis cette connexion. Veuillez réessayer un peu plus tard.",
      confirmedLabel: "Abonnement confirmé",
      confirmedTitle: "Vous faites partie de la liste",
      confirmedLead:
        "Merci d’avoir confirmé. Vous recevrez un e-mail à chaque nouvel article.",
      confirmedButton: "Lire le blog",
      failedLabel: "Lien expiré",
      failedTitle: "Ce lien n’a pas fonctionné",
      failedLead:
        "Il a peut-être expiré ou déjà servi. Vous pouvez vous abonner de nouveau en bas de n’importe quel article.",
      failedButton: "Aller au blog",
      emailSubject: "Confirmez votre abonnement au blog de Chestly Ace",
      emailIntro:
        "Merci de vous abonner aux nouveaux articles du blog de Chestly Ace.",
      emailAction: "Confirmer mon abonnement",
      emailExpires: "Ce lien est valable 48 heures.",
      emailIgnore:
        "Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail. Personne n’est abonné tant que le lien n’a pas été ouvert.",
    },
    privacy: {
      label: "Confidentialité",
      title: "Confidentialité",
      pageTitle: "Confidentialité — Chestly Ace",
      description:
        "Ce que le blog conserve au sujet de ses lecteurs, et pourquoi.",
      updatedLabel: "Dernière mise à jour : {date}",
      updated: "2026-10-08",
      // BROUILLON pour relecture par le propriétaire (design.md §14.18, Phase 9b.5b) :
      // texte relatif aux données personnelles, à faire relire avant la mise en ligne
      // du français. `{contact}` est l’adresse du formulaire de contact.
      text: `
Ce blog conserve très peu de choses à votre sujet. Cette page explique lesquelles, et pourquoi.

## Ce qui est conservé

- **Les « j’aime ».** Quand vous aimez un article, votre navigateur reçoit un cookie nommé \`blog_visitor\` contenant un code aléatoire. Je n’en garde qu’une copie brouillée (hachée), enregistrée à côté de l’article, afin qu’un « j’aime » ne compte qu’une fois. Elle ne permet pas de retrouver le code et ne dit rien sur votre identité.
- **Votre compte, si vous vous connectez pour commenter.** GitHub ou Google me transmet votre **nom, votre adresse e-mail et votre photo de profil**, et je les conserve. Un cookie de connexion (\`reader.session_token\`) vous garde connecté jusqu’à 30 jours.
- **Vos commentaires**, les « j’aime » que vous donnez aux commentaires, et les commentaires que vous signalez.
- **Lettre d’information.** Si vous vous abonnez, votre **adresse e-mail** est conservée chez Resend, le service d’e-mail avec lequel j’envoie la lettre. Elle n’est pas stockée dans la base de données de ce blog. Je ne l’ajoute qu’une fois que vous avez ouvert le lien de l’e-mail de confirmation ; si vous ne le faites jamais, elle n’est pas conservée.

## Pourquoi

Pour qu’un « j’aime » ne compte qu’une fois, pour vous permettre de commenter, pour vous garder connecté, pour vous envoyer les nouveaux articles si vous vous abonnez, et pour savoir qui a écrit quoi et traiter le spam ou les abus. Rien n’est utilisé à des fins publicitaires, et rien n’est vendu.

## Qui y a accès

- Votre **nom, votre photo et vos commentaires sont publics**, à côté de vos commentaires.
- Votre **adresse e-mail n’est jamais affichée** aux autres lecteurs. Je suis la seule personne à pouvoir la voir. Il en va de même pour l’adresse d’abonnement à la lettre : seuls Resend et moi la voyons, et je ne partage jamais la liste.
- Quand quelqu’un commente, je reçois un e-mail avec son nom et son commentaire (pas son adresse e-mail). Le site fonctionne sur Vercel, avec sa base de données et le service d’e-mail Resend, qui traitent ces données pour moi.

## Combien de temps

- Le cookie des « j’aime » dure un an.
- Une connexion dure jusqu’à 30 jours.
- Votre compte et vos commentaires restent jusqu’à ce que vous les supprimiez ou que je les retire.
- Une adresse d’abonnement reste jusqu’à votre désabonnement.

## Supprimer vos données

Connectez-vous, ouvrez le menu de votre nom sous les commentaires et choisissez **Supprimer mon compte**. Cela supprime votre nom, votre adresse e-mail, votre photo, votre connexion et vos « j’aime » sur les commentaires. Vos commentaires restent, affichés sous « Utilisateur supprimé » ; vous pouvez d’abord supprimer chacun d’eux vous-même. Chaque e-mail de la lettre contient un lien de désabonnement, qui arrête les envois. Si vous souhaitez que votre adresse soit entièrement retirée de la liste, ou que quoi que ce soit d’autre soit supprimé, demandez-le-moi.

## Questions

Utilisez le [formulaire de contact]({contact}) de mon site principal.
`,
    },
  },

  // Le texte du site Créations tel qu’écrit au départ (voir `creativesDefaults` en anglais).
  creativesDefaults: {
    heroStatement: "Design & Photographie",
    heroLine:
      "Identités visuelles et reportages d’événements par Chestly Ace (Amahndong Chestly).",
    designIntro:
      "Logos, affiches, campagnes pour les réseaux sociaux et visuels de marque, conçus pour avoir l’air voulus.",
    photographyIntro:
      "Événements, portraits et histoires de marque, à partir des moments qui valent la peine d’être gardés.",
    portalsTitle: "Deux façons de travailler",
    portalDesignText: "Identité visuelle, affiches et visuels de campagne.",
    portalPhotographyText: "Événements et portraits, racontés en images.",
    marqueeWords: [
      "Design graphique",
      "Photographie",
      "Identité visuelle",
      "Événements",
    ],
    contactStatement: "Un projet ou un événement à couvrir ?",
    contactText:
      "Dites-moi ce que vous avez en tête et je reviendrai vers vous avec des idées et un devis.",
    contactNote: "Je réponds en général sous un jour.",
    seoDescription:
      "Design graphique, identité visuelle et photographie par Chestly Ace (Amahndong Chestly).",
  },

  seo: {
    main: {
      title: "{name} ({legalName}) — Ingénierie logicielle",
      description:
        "{name} ({legalName}) conçoit des applications web, des back-ends et des API rapides et fiables. Missions à distance bienvenues.",
      jobTitle: "Ingénieur logiciel",
    },
    project: "{title} — Chestly Ace",
    creatives: {
      title: "Chestly Ace — Design & Photographie",
      description:
        "Design graphique, identité visuelle et photographie par Chestly Ace (Amahndong Chestly).",
    },
    blog: {
      title: "Chestly Ace — Blog",
      description:
        "Des écrits sur l’ingénierie logicielle, le développement web et la fabrication de produits.",
    },
  },
};
