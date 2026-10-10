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
