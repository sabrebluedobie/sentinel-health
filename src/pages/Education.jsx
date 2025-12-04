// src/pages/Education.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Education() {
  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-8">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Health Education</h1>
          <p className="text-zinc-600 mb-8">
            Understanding your health conditions helps you track more effectively and identify patterns.
          </p>

          {/* Migraine Types */}
          <section className="mb-8 pb-8 border-b border-zinc-200">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Types of Migraines</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Migraine with Aura</h3>
                <p className="text-zinc-600 mb-2">
                  Characterized by visual or sensory disturbances (aura) that occur before the headache phase. 
                  Auras typically last 20-60 minutes and may include:
                </p>
                <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-4">
                  <li>Visual changes (flashing lights, zigzag patterns, blind spots)</li>
                  <li>Sensory changes (tingling, numbness)</li>
                  <li>Speech or language difficulties</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Migraine without Aura</h3>
                <p className="text-zinc-600">
                  The most common type, featuring moderate to severe throbbing pain, usually on one side of the head. 
                  Often accompanied by nausea, vomiting, and sensitivity to light and sound. Episodes typically last 4-72 hours.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Chronic Migraine</h3>
                <p className="text-zinc-600">
                  Defined as having headaches on 15 or more days per month, with at least 8 days having migraine features. 
                  This pattern must persist for at least 3 months.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Silent Migraines (Acephalgic Migraines)</h3>
                <p className="text-zinc-600">
                  Silent migraines can be some of the most difficult to recognize because they don’t follow the “standard” presentation most people expect. Instead of the classic throbbing headache, silent migraines show up with neurological symptoms without any pain at all.<br></br>
This can include visual disturbances, aura-like flashes or zigzags, numbness, dizziness, speech difficulty, or a wave of fatigue that feels out of nowhere. Because there’s no headache to signal “this is a migraine,” they’re often mistaken for anxiety, eye strain, exhaustion, or even mini-strokes.<br></br>
Silent migraines behave like migraines internally — the brain is still going through the same electrical and chemical changes — but they never produce the painful phase. <br></br>
That absence of pain is exactly what makes them easy to miss and harder to diagnose, even though the experience can be just as disruptive.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Hemiplegic Migraine</h3>
                <p className="text-zinc-600">
                  A rare type causing temporary weakness or paralysis on one side of the body, along with typical migraine symptoms. 
                  Can be mistaken for a stroke and requires medical evaluation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Vestibular Migraine</h3>
                <p className="text-zinc-600">
                  Characterized by vertigo or dizziness along with migraine symptoms. Balance problems may occur before, 
                  during, or after the headache phase.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Menstrual Migraine</h3>
                <p className="text-zinc-600">
                  Occurs in a predictable pattern related to the menstrual cycle, typically 2 days before through 3 days 
                  after menstruation starts. Linked to hormonal fluctuations.
                </p>
              </div>
            </div>
          </section>

          {/* Common Triggers */}
          <section className="mb-8 pb-8 border-b border-zinc-200">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Common Migraine Triggers</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Environmental</h3>
                <ul className="list-disc list-inside text-zinc-600 space-y-1">
                  <li>Bright or flickering lights</li>
                  <li>Strong smells or perfumes</li>
                  <li>Weather changes or barometric pressure shifts</li>
                  <li>Loud noises</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Dietary</h3>
                <ul className="list-disc list-inside text-zinc-600 space-y-1">
                  <li>Aged cheeses</li>
                  <li>Processed meats with nitrates</li>
                  <li>Alcohol (especially red wine)</li>
                  <li>Caffeine (too much or withdrawal)</li>
                  <li>Artificial sweeteners</li>
                  <li>MSG and other food additives</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Lifestyle</h3>
                <ul className="list-disc list-inside text-zinc-600 space-y-1">
                  <li>Irregular sleep patterns</li>
                  <li>Skipped meals or dehydration</li>
                  <li>Stress or anxiety</li>
                  <li>Physical exhaustion</li>
                  <li>Changes in routine</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Hormonal</h3>
                <ul className="list-disc list-inside text-zinc-600 space-y-1">
                  <li>Menstrual cycle fluctuations</li>
                  <li>Birth control pills</li>
                  <li>Pregnancy or menopause</li>
                  <li>Hormone replacement therapy</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tracking Tips */}
          <section className="mb-8 pb-8 border-b border-zinc-200">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Effective Tracking Tips</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Log Consistently</h3>
                <p className="text-zinc-600">
                  Record every migraine episode, even mild ones. Patterns often emerge over time that aren't 
                  visible from individual episodes.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Track the Four Phases</h3>
                <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-4">
                  <li><strong>Prodrome:</strong> Early warning signs (hours to days before)</li>
                  <li><strong>Aura:</strong> Sensory disturbances (if applicable)</li>
                  <li><strong>Headache:</strong> Main pain phase</li>
                  <li><strong>Postdrome:</strong> Recovery period after pain subsides</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-zinc-800 mb-2">Note Everything</h3>
                <p className="text-zinc-600 mb-2">
                  Include details about:
                </p>
                <ul className="list-disc list-inside text-zinc-600 space-y-1 ml-4">
                  <li>Pain intensity (0-10 scale)</li>
                  <li>Location and type of pain (throbbing, stabbing, pressure)</li>
                  <li>Duration from start to complete resolution</li>
                  <li>Accompanying symptoms (nausea, light/sound sensitivity, vision changes)</li>
                  <li>Suspected triggers</li>
                  <li>Medications taken and their effectiveness</li>
                  <li>Impact on daily activities</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Sleep Connection */}
          <section className="mb-8 pb-8 border-b border-zinc-200">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Sleep & Migraine Connection</h2>
            <p className="text-zinc-600 mb-4">
              Sleep disturbances are both a common trigger and symptom of migraines. Understanding this relationship 
              can help you identify patterns and improve management.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-zinc-800 mb-2">Sleep Tips for Migraine Prevention</h3>
              <ul className="list-disc list-inside text-zinc-700 space-y-1">
                <li>Maintain consistent sleep/wake times (even on weekends)</li>
                <li>Aim for 7-9 hours of quality sleep per night</li>
                <li>Create a dark, quiet, cool sleeping environment</li>
                <li>Avoid screens 1-2 hours before bed</li>
                <li>Track your sleep patterns alongside migraines to identify connections</li>
              </ul>
            </div>
          </section>

          {/* Glucose Connection */}
          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">Blood Glucose & Migraines</h2>
            <p className="text-zinc-600 mb-4">
              Blood sugar fluctuations can trigger migraines in some people. Both hypoglycemia (low blood sugar) 
              and hyperglycemia (high blood sugar) have been associated with migraine episodes.
            </p>
            
            <div className="bg-amber-50 p-4 rounded-lg">
              <h3 className="font-medium text-zinc-800 mb-2">Managing Blood Sugar for Migraine Prevention</h3>
              <ul className="list-disc list-inside text-zinc-700 space-y-1">
                <li>Eat regular meals - don't skip breakfast</li>
                <li>Choose complex carbohydrates over simple sugars</li>
                <li>Include protein with meals to stabilize blood sugar</li>
                <li>Stay hydrated throughout the day</li>
                <li>Track glucose levels if you have diabetes or suspect glucose-related triggers</li>
              </ul>
            </div>
          </section>

          <div className="mt-8 p-4 bg-zinc-100 rounded-lg">
            <p className="text-sm text-zinc-600">
              <strong>Medical Disclaimer:</strong> This information is for educational purposes only and is not a 
              substitute for professional medical advice. Always consult with your healthcare provider about your 
              specific condition and treatment options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
