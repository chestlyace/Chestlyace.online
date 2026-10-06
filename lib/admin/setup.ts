// Things the admin needs from the environment, and how to say they're missing
// (dashboard notices, design.md §14.11). Pure, so it can be tested.
export function setupNotices(
  env: Record<string, string | undefined>,
): string[] {
  const notices: string[] = [];
  if (!env.RESEND_API_KEY) {
    notices.push(
      "Email sending isn't set up (RESEND_API_KEY), so the contact form can't deliver messages.",
    );
  }
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    notices.push(
      "Uploads aren't set up (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET), so images can't be uploaded yet.",
    );
  }
  return notices;
}
