// components/DebugAssistant.js
const askDebugQuestion = async (error, context) => {
  const prompt = `
    App: Vercel + Supabase health dashboard
    Error: ${error}
    Context: ${context}
    
    Provide a concise solution for this issue.
  `;
  
  // Call OpenAI, Anthropic, or another AI service
  const response = await fetch('/api/debug-assistant', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  
  return response.json();
};