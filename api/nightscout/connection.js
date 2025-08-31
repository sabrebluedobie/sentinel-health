// api/nightscout/connection.js
export async function saveConnection(req, res) {
  try {
    const { url, token, api_secret } = req.body;
    const userId = getUserFromAuth(req); // extract from Bearer token
    
    // Save to your nightscout_connections table
    const { error } = await supabase
      .from('nightscout_connections')
      .upsert({
        user_id: userId,
        url: url,
        token: token,
        api_secret: api_secret
      });
    
    if (error) throw error;
    
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
}