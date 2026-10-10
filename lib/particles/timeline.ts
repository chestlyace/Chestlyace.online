// The loop of the footer's particle wordmark (design.md §13.61): which form the dots
// hold, when they morph to the next, and a tap that moves on at once. Pure.

export type FormKind =
  "word" | "braces" | "lattice" | "bezier" | "wheel" | "camera" | "aperture";
export type Form = {
  id: string;
  kind: FormKind;
  /** The word, for a word form. */
  text?: string;
  /** Seconds the dots hold the form. */
  hold: number;
  /** A 3D form that turns about its vertical axis. */
  spin?: boolean;
};

export const LOOP: readonly Form[] = [
  { id: "name", kind: "word", text: "CHESTLY ACE", hold: 3.5 },
  { id: "braces", kind: "braces", hold: 2.5 },
  { id: "lattice", kind: "lattice", hold: 2.5, spin: true },
  { id: "developer", kind: "word", text: "DEVELOPER", hold: 3.5 },
  { id: "bezier", kind: "bezier", hold: 2.5 },
  { id: "wheel", kind: "wheel", hold: 2.5 },
  { id: "designer", kind: "word", text: "DESIGNER", hold: 3.5 },
  { id: "camera", kind: "camera", hold: 2.5 },
  { id: "aperture", kind: "aperture", hold: 2.5 },
  { id: "photographer", kind: "word", text: "PHOTOGRAPHER", hold: 3.5 },
];

export const MORPH_SECONDS = 1.8;
/** The turn of a spinning form: about 0.15 turn per second. */
export const SPIN_RADIANS_PER_SECOND = 0.15 * Math.PI * 2;

/** The form index of the scattered cloud the dots start from. */
export const CLOUD = -1;

export class Timeline {
  /** The form the dots are leaving (or holding); `CLOUD` at the start. */
  from = CLOUD;
  /** The form they are heading to (or holding). */
  to = 0;
  /** `true` while morphing, `false` while holding `to`. */
  morphing = true;
  /** Progress of the morph, 0..1 (linear; the shader eases it per dot). */
  mix = 0;
  /** Seconds into the current hold or morph. */
  private elapsed = 0;

  constructor(private readonly loop: readonly Form[] = LOOP) {}

  /**
   * Advances by `dt` seconds. Says whether a morph started (the dots' buffers need the
   * new `from` and `to`) and whether one ended (`from` and `to` are now the same).
   */
  update(dt: number): { started: boolean; ended: boolean } {
    this.elapsed += dt;
    let started = false;
    let ended = false;
    if (this.morphing) {
      this.mix = Math.min(1, this.elapsed / MORPH_SECONDS);
      if (this.mix >= 1) {
        this.from = this.to;
        this.morphing = false;
        this.mix = 0;
        this.elapsed -= MORPH_SECONDS;
        ended = true;
      }
    }
    if (!this.morphing && this.elapsed >= this.loop[this.to].hold) {
      this.startMorph(this.elapsed - this.loop[this.to].hold);
      started = true;
    }
    return { started, ended };
  }

  /** A tap: moves on to the next form at once (ignored while morphing). */
  skip(): boolean {
    if (this.morphing) return false;
    this.startMorph(0);
    return true;
  }

  /** The form after the one held (or being headed to). */
  get next(): number {
    return (this.to + 1) % this.loop.length;
  }

  private startMorph(carry: number) {
    this.from = this.to;
    this.to = this.next;
    this.morphing = true;
    this.elapsed = carry;
    this.mix = Math.min(1, carry / MORPH_SECONDS);
  }
}
