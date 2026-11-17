export interface StageText {
  /** Stage title without the "STAGE I" label, e.g. "Nigredo. Encounter with the Shadow" */
  title: string;
  /** Optional opening quote, shown in an accent style */
  q?: string;
  /** Body paragraphs */
  p: string[];
  /** Source / sub-caption */
  cite?: string;
}

export interface Locale {
  code: string;
  /** Short label for the language switch */
  label: string;
  /** Native language name */
  name: string;
  ui: {
    loading: string;
    enter: string;
    musicOn: string;
    musicOff: string;
    scroll: string;
    stage: string;
    epilogue: string;
    chooseLanguage: string;
    skipIntro: string;
    credit: string;
    footerNote: string;
  };
  hero: { tagline: string; quote: string; cite: string };
  stages: StageText[]; // exactly 7
  epilogue: { title: string; q: string; p: string[]; finale: string };
}
