export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  // If you use an aggregator (e.g., Terra/Vital), generate a connect URL here from env vars.
  const CONNECT_URL = process.env.CGM_OAUTH_URL; // e.g., from your aggregator or provider
  if (CONNECT_URL) {
    return res.status(200).json({ url: CONNECT_URL });
  }
  return res.status(200).json({ message: "CGM connect is not configured yet. Set CGM_OAUTH_URL in env." });
}
