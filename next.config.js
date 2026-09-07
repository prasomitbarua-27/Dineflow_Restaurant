/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // The admin Food/Category forms let an admin paste any image URL they
    // want (until Phase 5 replaces this with real uploads to Supabase
    // Storage), and Next.js's image optimizer refuses to fetch from a
    // domain that isn't explicitly listed here. Wildcarding the hostname
    // is the pragmatic fix so an admin isn't blocked from using a photo
    // from, say, their phone's cloud storage or a different stock site —
    // but it does mean the image optimizer will proxy-fetch from
    // wherever an authenticated admin points it, so this is intentionally
    // loosened, not an oversight. Revisit once Phase 5 (real uploads)
    // lands and admins no longer need to paste arbitrary URLs at all.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
