// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

export async function listLmntVoices(){
  const res = await fetch("/api/lmnt-voices");
  if(!res.ok) throw new Error(await res.text());
  return await res.json();
}
export async function speakLmnt(text, { voiceId="morgan", format="mp3" }={}){
  const res = await fetch("/api/tts-lmnt", { method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ text, voice: voiceId, format }) });
  if(!res.ok) throw new Error(await res.text());
  const buf = await res.arrayBuffer();
  const blob = new Blob([buf], { type: format==="webm"?"audio/webm":"audio/mpeg" });
  const url = URL.createObjectURL(blob);
  await new Promise((resolve)=>{ const a=new Audio(url); a.onended=()=>{URL.revokeObjectURL(url);resolve();}; a.onerror=()=>{URL.revokeObjectURL(url);resolve();}; a.play().catch(()=>resolve()); });
}
export function speakBrowser(text, { rate=1, pitch=1, volume=1, lang="en-US", voiceName }={}) {
  return new Promise(resolve=>{
    try {
      const synth = window.speechSynthesis; if(!synth) return resolve();
      const u = new SpeechSynthesisUtterance(text); Object.assign(u,{rate,pitch,volume,lang});
      const voices = synth.getVoices?.()||[]; const match = voices.find(v=>v.name===voiceName); if(match) u.voice = match;
      u.onend=resolve; u.onerror=resolve; synth.cancel(); synth.speak(u);
    } catch { resolve(); }
  });
}
export function stopSpeaking(){ try{ window.speechSynthesis?.cancel(); }catch{} }
