// The cache tag of the creatives site's public reads (like `portfolio` for the main
// site and `blog` for the blog): every write in the admin revalidates it, so a
// page stays static until something changes (D74). The reads arrive with the
// pages (10b.3).
export const CREATIVES_TAG = "creatives";
