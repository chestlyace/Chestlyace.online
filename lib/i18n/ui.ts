import type { Lang } from "./index";

// The few words shared components need on every page (a link that opens a new tab,
// …), kept apart from the dictionaries so a client component can use them without
// downloading a whole dictionary (docs/i18n.md §4).
export const NEW_TAB: Record<Lang, string> = {
  en: "opens in a new tab",
  fr: "s’ouvre dans un nouvel onglet",
};

/**
 * The words of the blog's interactive blocks and prose chrome (copy buttons, quiz,
 * terminal, session replay, callout labels…). They live apart from the dictionaries
 * because many small client components use a few each; a post's blocks read them with
 * `useBlockText()` (client) or `BLOCK_TEXT[lang]` (server). Placeholders are `{name}`.
 */
export type BlockText = {
  copyCode: string;
  copyNewCode: string;
  copyCommands: string;
  copied: string;
  skip: string;
  headingLink: string;
  table: string;
  note: string;
  tip: string;
  warning: string;
  compare: string;
  comparison: string;
  recommended: string;
  quizResult: string;
  quizQuestion: string;
  quizScore: string;
  quizAgain: string;
  quizCorrect: string;
  quizNotQuite: string;
  quizSeeResult: string;
  quizNext: string;
  quizPerfect: string;
  quizGood: string;
  quizRetry: string;
  finishTyping: string;
  replayTyping: string;
  typedOut: string;
  finishSession: string;
  replaySession: string;
  terminal: string;
  terminalSession: string;
  files: string;
  fileTree: string;
  code: string;
  diagram: string;
  flow: string;
  agentSession: string;
  transcript: string;
  turnsRange: string;
  pause: string;
  playSession: string;
  replay: string;
  play: string;
  previousTurn: string;
  nextTurn: string;
  speed: string;
  turnsShown: string;
  turnsOf: string;
  collapse: string;
  expandAll: string;
  showAllLines: string;
  you: string;
  agent: string;
  output: string;
  thinking: string;
  added: string;
  removed: string;
};

export const BLOCK_TEXT: Record<Lang, BlockText> = {
  en: {
    copyCode: "Copy code",
    copyNewCode: "Copy new code",
    copyCommands: "Copy commands",
    copied: "Copied",
    skip: "Skip",
    headingLink: "Link to this heading",
    table: "Table",
    note: "Note",
    tip: "Tip",
    warning: "Warning",
    compare: "Compare",
    comparison: "Comparison",
    recommended: "Recommended",
    quizResult: "Result",
    quizQuestion: "Question {n} / {total}",
    quizScore: "You got {score} of {total}.",
    quizAgain: "Try again",
    quizCorrect: "Correct",
    quizNotQuite: "Not quite",
    quizSeeResult: "See result",
    quizNext: "Next question",
    quizPerfect: "Perfect.",
    quizGood: "Nicely done. Worth another look at the ones you missed.",
    quizRetry: "Worth reading the post again, then try once more.",
    finishTyping: "Finish typing",
    replayTyping: "Replay typing",
    typedOut: "{title} code, typed out",
    finishSession: "Finish the session",
    replaySession: "Replay the session",
    terminal: "Terminal",
    terminalSession: "{title} session",
    files: "Files",
    fileTree: "File tree",
    code: "{title} code",
    diagram: "Diagram: {title}",
    flow: "flow",
    agentSession: "{title}: agent session",
    transcript: "Transcript, turns {range}",
    turnsRange: "{from} to {to}",
    pause: "Pause",
    playSession: "Play session",
    replay: "Replay",
    play: "Play",
    previousTurn: "Previous turn",
    nextTurn: "Next turn",
    speed: "Speed: {speed}×. Change speed",
    turnsShown: "Turns shown",
    turnsOf: "{shown} of {total} turns",
    collapse: "Collapse",
    expandAll: "Expand all",
    showAllLines: "Show all {count} lines",
    you: "You",
    agent: "Agent",
    output: "Output",
    thinking: "Thinking",
    added: "added",
    removed: "removed",
  },
  fr: {
    copyCode: "Copier le code",
    copyNewCode: "Copier le nouveau code",
    copyCommands: "Copier les commandes",
    copied: "Copié",
    skip: "Passer",
    headingLink: "Lien vers ce titre",
    table: "Tableau",
    note: "Note",
    tip: "Astuce",
    warning: "Attention",
    compare: "Comparer",
    comparison: "Comparaison",
    recommended: "Recommandé",
    quizResult: "Résultat",
    quizQuestion: "Question {n} / {total}",
    quizScore: "Vous avez obtenu {score} sur {total}.",
    quizAgain: "Réessayer",
    quizCorrect: "Exact",
    quizNotQuite: "Pas tout à fait",
    quizSeeResult: "Voir le résultat",
    quizNext: "Question suivante",
    quizPerfect: "Parfait.",
    quizGood:
      "Bien joué. Les questions manquées méritent un nouveau coup d’œil.",
    quizRetry: "Relisez l’article, puis réessayez.",
    finishTyping: "Terminer la saisie",
    replayTyping: "Rejouer la saisie",
    typedOut: "Code {title}, saisi à l’écran",
    finishSession: "Terminer la session",
    replaySession: "Rejouer la session",
    terminal: "Terminal",
    terminalSession: "Session {title}",
    files: "Fichiers",
    fileTree: "Arborescence de fichiers",
    code: "Code {title}",
    diagram: "Schéma : {title}",
    flow: "flux",
    agentSession: "{title} : session de l’agent",
    transcript: "Transcription, tours {range}",
    turnsRange: "{from} à {to}",
    pause: "Pause",
    playSession: "Lancer la session",
    replay: "Rejouer",
    play: "Lecture",
    previousTurn: "Tour précédent",
    nextTurn: "Tour suivant",
    speed: "Vitesse : {speed}×. Changer la vitesse",
    turnsShown: "Tours affichés",
    turnsOf: "{shown} tours sur {total}",
    collapse: "Réduire",
    expandAll: "Tout afficher",
    showAllLines: "Afficher les {count} lignes",
    you: "Vous",
    agent: "Agent",
    output: "Sortie",
    thinking: "Réflexion",
    added: "ajouté",
    removed: "supprimé",
  },
};

/**
 * The words of the creatives site (docs/i18n.md §4): page headings and labels, the
 * gallery, the lightboxes, the event pages and the contact block. The wording the owner
 * edits in the admin (hero, intros, portals, contact statement, marquee) is not here:
 * it is the settings' built-in wording in the dictionaries (`creativesDefaults`).
 * Placeholders are `{name}`.
 */
export type CreativesUi = {
  designLabel: string;
  designTitle: string;
  designMetaTitle: string;
  photographyLabel: string;
  photographyTitle: string;
  photographyMetaTitle: string;
  moreComingSoon: string;
  eventMetaTitle: string;
  eventMetaFallback: string;
  eventMetaFallbackAt: string;
  servicesLabel: string;
  servicesTitle: string;
  servicesIntro: string;
  servicesMetaTitle: string;
  servicesMetaDescription: string;
  groupDesign: string;
  groupPhotography: string;
  requestDesign: string;
  bookSession: string;
  messageDesign: string;
  messagePhotography: string;
  faqLabel: string;
  faqTitle: string;
  contactLabel: string;
  contactMessage: string;
  whatsapp: string;
  email: string;
  instagram: string;
  workLabel: string;
  portalDesignIndex: string;
  portalDesignName: string;
  portalPhotographyIndex: string;
  portalPhotographyName: string;
  viewWork: string;
  view: string;
  selectedLabel: string;
  selectedTitle: string;
  selectedAria: string;
  selectedItem: string;
  heroWork: string;
  heroContact: string;
  teaserLabel: string;
  teaserTitle: string;
  teaserAll: string;
  pieces: { one: string; other: string };
  designPieces: string;
  filter: string;
  filterAll: string;
  openEvent: string;
  photos: { one: string; other: string };
  openPicture: string;
  picturesFrom: string;
  cover: string;
  aboutEvent: string;
  termEvent: string;
  termDate: string;
  termPlace: string;
  termRole: string;
  covered: string;
  album: string;
  albumOn: string;
  credits: string;
  nextEvent: string;
  previousPiece: string;
  nextPiece: string;
  pieceImages: string;
  imageOf: string;
  aboutPiece: string;
  aboutPieceHeading: string;
  termCategory: string;
  termClient: string;
  termYear: string;
  termTools: string;
  viewProject: string;
  close: string;
  pictureOf: string;
  previousPicture: string;
  nextPicture: string;
};

export const CREATIVES_UI: Record<Lang, CreativesUi> = {
  en: {
    designLabel: "Graphic design · {count}",
    designTitle: "Design",
    designMetaTitle: "Graphic design — Chestly Ace",
    photographyLabel: "Photography · {count}",
    photographyTitle: "Photography",
    photographyMetaTitle: "Photography — Chestly Ace",
    moreComingSoon: "More coming soon",
    eventMetaTitle: "{title} — Photography — Chestly Ace",
    eventMetaFallback: "Photographs from {title}.",
    eventMetaFallbackAt: "Photographs from {title}, {place}.",
    servicesLabel: "Services",
    servicesTitle: "Services",
    servicesIntro:
      "Graphic design and photography for brands, creators and events: logos, social media graphics and posters, event coverage and portraits.",
    servicesMetaTitle: "Design & photography services — Chestly Ace",
    servicesMetaDescription:
      "Graphic design, branding and photography services by Chestly Ace (Amahndong Chestly): logos, social media graphics and posters, event and portrait photography.",
    groupDesign: "Graphic design",
    groupPhotography: "Photography",
    requestDesign: "Request design work",
    bookSession: "Book a session",
    messageDesign:
      "Hi Chestly, I saw your services page and I'd like to request some design work: ",
    messagePhotography:
      "Hi Chestly, I saw your services page and I'd like to book a photography session: ",
    faqLabel: "FAQ",
    faqTitle: "Questions",
    contactLabel: "Contact",
    contactMessage:
      "Hi Chestly, I saw your creative work and I'd like to talk about…",
    whatsapp: "WhatsApp",
    email: "Email",
    instagram: "Instagram",
    workLabel: "Work",
    portalDesignIndex: "01 — GRAPHIC DESIGN",
    portalDesignName: "Graphic design",
    portalPhotographyIndex: "02 — PHOTOGRAPHY",
    portalPhotographyName: "Photography",
    viewWork: "View the work",
    view: "View",
    selectedLabel: "SELECTED",
    selectedTitle: "Selected work",
    selectedAria: "Selected work, scroll sideways",
    selectedItem: "{title}, {kind}",
    heroWork: "See the work",
    heroContact: "Get in touch",
    teaserLabel: "SERVICES",
    teaserTitle: "What I can do for you",
    teaserAll: "All services",
    pieces: { one: "{count} piece", other: "{count} pieces" },
    designPieces: "Design pieces",
    filter: "Filter by category",
    filterAll: "All · {count}",
    openEvent: "Open the event",
    photos: { one: "{count} PHOTO", other: "{count} PHOTOS" },
    openPicture: "Open picture {n}",
    picturesFrom: "Pictures from {title}",
    cover: "Cover",
    aboutEvent: "About the event",
    termEvent: "Event",
    termDate: "Date",
    termPlace: "Place",
    termRole: "Role",
    covered: "What was covered",
    album: "View the full album",
    albumOn: "On {service}",
    credits: "CREDITS",
    nextEvent: "NEXT EVENT",
    previousPiece: "Previous piece",
    nextPiece: "Next piece",
    pieceImages: "Images of this piece",
    imageOf: "Image {n} of {total}",
    aboutPiece: "About this piece",
    aboutPieceHeading: "About the piece",
    termCategory: "Category",
    termClient: "Client",
    termYear: "Year",
    termTools: "Tools",
    viewProject: "View the project",
    close: "Close",
    pictureOf: "{title}, picture {n} of {total}",
    previousPicture: "Previous picture",
    nextPicture: "Next picture",
  },
  fr: {
    designLabel: "Design graphique · {count}",
    designTitle: "Design",
    designMetaTitle: "Design graphique — Chestly Ace",
    photographyLabel: "Photographie · {count}",
    photographyTitle: "Photographie",
    photographyMetaTitle: "Photographie — Chestly Ace",
    moreComingSoon: "D’autres reportages arrivent bientôt",
    eventMetaTitle: "{title} — Photographie — Chestly Ace",
    eventMetaFallback: "Photographies de {title}.",
    eventMetaFallbackAt: "Photographies de {title}, {place}.",
    servicesLabel: "Services",
    servicesTitle: "Services",
    servicesIntro:
      "Design graphique et photographie pour les marques, les créateurs et les événements : logos, visuels pour les réseaux sociaux et affiches, couverture d’événements et portraits.",
    servicesMetaTitle: "Services de design et de photographie — Chestly Ace",
    servicesMetaDescription:
      "Services de design graphique, d’identité visuelle et de photographie par Chestly Ace (Amahndong Chestly) : logos, visuels pour les réseaux sociaux et affiches, photographie d’événements et de portraits.",
    groupDesign: "Design graphique",
    groupPhotography: "Photographie",
    requestDesign: "Demander un travail de design",
    bookSession: "Réserver une séance",
    messageDesign:
      "Bonjour Chestly, j’ai vu votre page de services et je souhaite vous confier un travail de design : ",
    messagePhotography:
      "Bonjour Chestly, j’ai vu votre page de services et je souhaite réserver une séance photo : ",
    faqLabel: "FAQ",
    faqTitle: "Questions",
    contactLabel: "Contact",
    contactMessage:
      "Bonjour Chestly, j’ai vu vos créations et je souhaite vous parler de…",
    whatsapp: "WhatsApp",
    email: "E-mail",
    instagram: "Instagram",
    workLabel: "Réalisations",
    portalDesignIndex: "01 — DESIGN GRAPHIQUE",
    portalDesignName: "Design graphique",
    portalPhotographyIndex: "02 — PHOTOGRAPHIE",
    portalPhotographyName: "Photographie",
    viewWork: "Voir les réalisations",
    view: "Voir",
    selectedLabel: "SÉLECTION",
    selectedTitle: "Travaux choisis",
    selectedAria: "Travaux choisis, défilement horizontal",
    selectedItem: "{title}, {kind}",
    heroWork: "Voir les réalisations",
    heroContact: "Me contacter",
    teaserLabel: "SERVICES",
    teaserTitle: "Ce que je peux faire pour vous",
    teaserAll: "Tous les services",
    pieces: { one: "{count} création", other: "{count} créations" },
    designPieces: "Créations de design",
    filter: "Filtrer par catégorie",
    filterAll: "Tout · {count}",
    openEvent: "Ouvrir le reportage",
    photos: { one: "{count} PHOTO", other: "{count} PHOTOS" },
    openPicture: "Ouvrir la photo {n}",
    picturesFrom: "Photos de {title}",
    cover: "Couverture",
    aboutEvent: "À propos de l’événement",
    termEvent: "Événement",
    termDate: "Date",
    termPlace: "Lieu",
    termRole: "Rôle",
    covered: "Ce qui a été couvert",
    album: "Voir l’album complet",
    albumOn: "Sur {service}",
    credits: "CRÉDITS",
    nextEvent: "ÉVÉNEMENT SUIVANT",
    previousPiece: "Création précédente",
    nextPiece: "Création suivante",
    pieceImages: "Images de cette création",
    imageOf: "Image {n} sur {total}",
    aboutPiece: "À propos de cette création",
    aboutPieceHeading: "À propos de la création",
    termCategory: "Catégorie",
    termClient: "Client",
    termYear: "Année",
    termTools: "Outils",
    viewProject: "Voir le projet",
    close: "Fermer",
    pictureOf: "{title}, photo {n} sur {total}",
    previousPicture: "Photo précédente",
    nextPicture: "Photo suivante",
  },
};
