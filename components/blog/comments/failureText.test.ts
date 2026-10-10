import { describe, expect, it } from "vitest";
import { en } from "@/content/messages/en";
import { fr } from "@/content/messages/fr";
import { failureText } from "./failureText";

describe("failureText", () => {
  it("words a refused comment in the page's language, with its numbers", () => {
    const failure = {
      code: "too-many-words",
      message: "Keep it to 120 words or fewer (it is 130).",
      values: { max: 120, words: 130 },
    };
    expect(failureText(en.blog.comments, failure, 422)).toBe(
      "Keep it to 120 words or fewer (it is 130).",
    );
    expect(failureText(fr.blog.comments, failure, 422)).toBe(
      "Limitez-vous à 120 mots (il en compte 130).",
    );
  });

  it("falls back to the API's message for a code it does not know, then to the status", () => {
    expect(
      failureText(fr.blog.comments, { code: "new", message: "Hmm." }, 422),
    ).toBe("Hmm.");
    expect(failureText(fr.blog.comments, {}, 401)).toBe(
      fr.blog.comments.signInEnded,
    );
    expect(failureText(fr.blog.comments, {}, 403)).toBe(
      fr.blog.comments.forbidden,
    );
    expect(failureText(fr.blog.comments, {}, 429)).toBe(
      fr.blog.comments.slowDown,
    );
    expect(failureText(fr.blog.comments, {}, 500)).toBe(
      fr.blog.comments.failed,
    );
  });
});
