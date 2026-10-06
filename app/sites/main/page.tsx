import { Hero } from "@/components/main/Hero";
import { getCachedHomepageData } from "@/lib/portfolio";

export default async function Home() {
  const { profile, socials } = await getCachedHomepageData();

  // The profile row is the page's source of truth; without it there is nothing
  // to show (an unseeded database).
  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 pt-32 pb-24">
        <p className="text-muted">Portfolio content isn&rsquo;t loaded yet.</p>
      </div>
    );
  }

  return <Hero profile={profile} socials={socials} />;
}
