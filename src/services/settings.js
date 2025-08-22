// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

export const DEFAULTS = {
  SYMPTOMS: ["Nausea","Vomiting","Photophobia","Phonophobia","Aura","Dizziness","Neck pain","Numbness/tingling","Blurred vision","Fatigue","Osmophobia","Allodynia"],
  TRIGGERS: ["Stress","Lack of sleep","Dehydration","Skipped meal","Bright lights","Strong smells","Hormonal","Weather","Heat","Screen time","Alcohol","Chocolate","Caffeine change"],
};
export function getSymptomOptions(){ try{ return JSON.parse(localStorage.getItem("app.symptomOptions")||"null")||DEFAULTS.SYMPTOMS; }catch{return DEFAULTS.SYMPTOMS;} }
export function getTriggerOptions(){ try{ return JSON.parse(localStorage.getItem("app.triggerOptions")||"null")||DEFAULTS.TRIGGERS; }catch{return DEFAULTS.TRIGGERS;} }
