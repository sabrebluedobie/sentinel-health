// Redirect user to Dexcom authorize (Sandbox or Prod via env)
export default async function handler(req, res) {
  const { DEXCOM_CLIENT_ID, DEXCOM_REDIRECT_URI, DEXCOM_BASE = "https://sandbox-api.dexcom.com" } = process.env;
  const authorize = `${DEXCOM_BASE}/v2/oauth2/login?client_id=${encodeURIComponent(DEXCOM_CLIENT_ID)}&redirect_uri=${encodeURIComponent(DEXCOM_REDIRECT_URI)}&response_type=code&scope=offline_access&state=${encodeURIComponent(req.query.state || "")}`;
  res.redirect(authorize);
}
