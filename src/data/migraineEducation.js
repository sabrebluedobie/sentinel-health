// src/data/migraineEducation.js (or inline in Dashboard.jsx)
export const MIGRAINE_TYPES = [
  {
    id: "with-aura",
    title: "Migraine with Aura",
    short: "Neurologic symptoms (visual, sensory, speech) that precede or accompany headache.",
    symptoms: [
      "Visual: flashing lights, zigzag lines, blind spots (scotomas)",
      "Sensory: numbness, pins-and-needles (often face/hand), spreading over minutes",
      "Speech/language difficulty (dysphasia)",
      "Headache usually follows within 60 minutes, but may start during aura"
    ],
    notes: [
      "Not all aura is visual; sensory and speech auras are common.",
      "If aura is new, prolonged, or atypical, seek medical care."
    ]
  },
  {
    id: "without-aura",
    title: "Migraine without Aura",
    short: "The most common type; no preceding aura.",
    symptoms: [
      "Moderate to severe throbbing/pulsing pain (often one-sided)",
      "Worse with routine activity",
      "Nausea and/or vomiting",
      "Sensitivity to light (photophobia) and sound (phonophobia)"
    ],
    notes: ["Attacks last 4–72 hours without treatment in many cases."]
  },
  {
    id: "silent-acephalgic",
    title: "Silent Migraine (Acephalgic)",
    short: "Aura-like symptoms occur without the headache phase.",
    symptoms: [
      "Visual changes, zigzags, shimmering, blind spots",
      "Dizziness or vertigo, confusion, or speech difficulty",
      "May include sensory symptoms like tingling or numbness",
      "No significant head pain"
    ],
    notes: [
      "Often mistaken for anxiety or mini-stroke; pattern recognition is key.",
      "New or stroke-like symptoms require urgent evaluation."
    ]
  },
  {
    id: "hemiplegic",
    title: "Hemiplegic Migraine",
    short: "Temporary one-sided weakness with aura.",
    symptoms: [
      "Weakness or paralysis on one side of the body",
      "Numbness, visual aura, speech difficulty",
      "Headache may follow neurologic symptoms"
    ],
    notes: [
      "Can mimic stroke — urgent evaluation is important, especially if first episode.",
      "Family or sporadic forms exist; providers may tailor treatment."
    ]
  },
  {
    id: "vestibular",
    title: "Vestibular Migraine",
    short: "Prominent dizziness/vertigo and balance issues; headache may be absent.",
    symptoms: [
      "Spinning sensation (vertigo) or rocking/swaying imbalance",
      "Motion sensitivity, nausea, visual dependence",
      "Light/sound sensitivity may occur with or without head pain"
    ],
    notes: ["Attacks range minutes to hours; often triggered by visual motion or stress."]
  },
  {
    id: "retinal",
    title: "Retinal Migraine",
    short: "Repeated, reversible vision loss in one eye only.",
    symptoms: [
      "Transient monocular vision loss or blind spot in a single eye",
      "May include eye pain or headache on the same side",
      "Episodes are brief (usually <60 minutes) and recurring"
    ],
    notes: [
      "Because other eye conditions can look similar, medical evaluation is recommended.",
      "Track which eye is affected; cover each eye to test."
    ]
  },
  {
    id: "chronic",
    title: "Chronic Migraine",
    short: "≥15 headache days/month for 3+ months, with ≥8 migraine-like days.",
    symptoms: [
      "Frequent headaches with migraine features (throbbing, sensitivity, nausea)",
      "Often includes neck pain, brain fog, fatigue",
      "Medication overuse can maintain frequency"
    ],
    notes: [
      "Preventive strategies are central; consider lifestyle, sleep, and triggers.",
      "Work with a clinician on a personalized prevention plan."
    ]
  },
  {
    id: "menstrual",
    title: "Menstrual-Related Migraine",
    short: "Attacks tied to hormonal fluctuations around menses.",
    symptoms: [
      "Attacks often occur from two days before to three days after menses onset",
      "Similar features to migraine without aura",
      "May be more severe or treatment-resistant"
    ],
    notes: [
      "Logging cycle patterns helps with timing acute or mini-preventive options."
    ]
  },
  {
    id: "brainstem",
    title: "Migraine with Brainstem Aura (Basilar-type)",
    short: "Aura from brainstem symptoms without motor weakness.",
    symptoms: [
      "Vertigo, double vision, slurred speech, ringing in ears",
      "Ataxia (unsteady movements), decreased alertness",
      "Often followed by headache"
    ],
    notes: [
      "Can look alarming; rule-out of other causes is important with a clinician."
    ]
  }
];
export const REFERENCES = [ /* ... */ ];
export const FALLBACK_TOPICS = [ /* ... */ ];