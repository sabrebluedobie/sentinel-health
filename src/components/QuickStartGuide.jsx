import React, { useState } from "react";
import { X, CheckCircle, Target, TrendingUp, Calendar } from "lucide-react";

export default function QuickStartGuide({ moduleProfile, onDismiss }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  const enabled = moduleProfile?.enabled_modules || {};
  const hasGlucose = !!enabled.glucose;
  const hasSleep = !!enabled.sleep;
  const hasMigraine = !!enabled.migraine;
  const hasPain = !!enabled.pain;

  // Build personalized steps based on enabled modules
  const steps = [
    {
      title: "Welcome to Sentrya! 🎉",
      icon: Target,
      showImage: true,
      content: (
        <div className="space-y-4">
          {/* Hero Image */}
          <div className="rounded-xl overflow-hidden -mx-6 -mt-6 mb-6">
            <img 
              src="/assets/mobile-friendly_1.webp" 
              alt="Person using health tracking app"
              className="w-full h-48 object-cover"
            />
          </div>
          
          <p className="text-gray-700 text-lg">
            You're all set up! Here's how to get the most out of your health tracking:
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="font-medium text-blue-900 mb-2">📊 Your Goal for Week 1:</div>
            <p className="text-sm text-blue-800">
              Log data for <strong>at least 7 days</strong> to start seeing meaningful patterns. 
              The more consistent you are, the better insights you'll get!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "What You're Tracking",
      icon: CheckCircle,
      content: (
        <div className="space-y-3">
          <p className="text-gray-700">
            Based on your setup, you'll be tracking:
          </p>
          <ul className="space-y-3">
            {hasMigraine && (
              <li className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-red-600 text-xl">✓</span>
                <div>
                  <strong className="text-red-900">Migraines:</strong>
                  <p className="text-sm text-red-700 mt-1">
                    Log each episode with pain level (0-10) and any notes about triggers
                  </p>
                </div>
              </li>
            )}
            {hasSleep && (
              <li className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-blue-600 text-xl">✓</span>
                <div>
                  <strong className="text-blue-900">Sleep:</strong>
                  <p className="text-sm text-blue-700 mt-1">
                    Record hours slept and quality metrics each morning
                  </p>
                </div>
              </li>
            )}
            {hasGlucose && (
              <li className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <span className="text-purple-600 text-xl">✓</span>
                <div>
                  <strong className="text-purple-900">Glucose:</strong>
                  <p className="text-sm text-purple-700 mt-1">
                    Track blood sugar readings {moduleProfile?.module_options?.glucose?.source === 'cgm' ? '(synced from CGM)' : '(manual entry)'}
                  </p>
                </div>
              </li>
            )}
            {hasPain && (
              <li className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                <span className="text-orange-600 text-xl">✓</span>
                <div>
                  <strong className="text-orange-900">Pain:</strong>
                  <p className="text-sm text-orange-700 mt-1">
                    Log general pain levels throughout the day
                  </p>
                </div>
              </li>
            )}
          </ul>
          {!hasMigraine && !hasSleep && !hasGlucose && !hasPain && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-sm">
                You haven't enabled any tracking modules yet. Go to Settings to turn on what you want to track.
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "How to Log Your First Entry",
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Getting started is easy! Here's how to log your first entry:
          </p>
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-bold">1</span>
                <div className="font-medium text-blue-900">Find the Quick Actions</div>
              </div>
              <p className="text-sm text-blue-800 ml-8">
                On the Dashboard, you'll see Quick Action buttons at the top. Click any module to log data.
              </p>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full text-sm font-bold">2</span>
                <div className="font-medium text-purple-900">Fill in the Form</div>
              </div>
              <p className="text-sm text-purple-800 ml-8">
                Enter your data (pain level, sleep hours, etc.). Don't worry about being perfect—you can always add more detail later.
              </p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full text-sm font-bold">3</span>
                <div className="font-medium text-green-900">Submit & View</div>
              </div>
              <p className="text-sm text-green-800 ml-8">
                Your data appears on the Dashboard immediately. After a few days, you'll start seeing trends!
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Understanding Your Insights",
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            After logging for about a week, you'll see:
          </p>
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="font-medium text-gray-900 flex items-center gap-2">
                <span>📈</span> Trend Charts
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Visual graphs showing how your metrics change over time. Look for patterns!
              </p>
            </div>
            {((hasGlucose || hasSleep) && (hasPain || hasMigraine)) && (
              <div className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="font-medium text-gray-900 flex items-center gap-2">
                  <span>🔗</span> Correlations
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Numbers from -1 to +1 showing relationships between your metrics. 
                  Values above 0.5 or below -0.5 suggest moderate connections.
                </p>
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>⚠️ Important:</strong> You'll need at least <strong>10 days</strong> of data for reliable correlations. 
                  Sample sizes (n) are shown to help you judge reliability.
                </div>
              </div>
            )}
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <div className="font-medium text-gray-900 flex items-center gap-2">
                <span>💡</span> Personalized Insights
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Over time, you may discover triggers or patterns unique to you. These insights can help you make informed decisions.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Pro Tips for Success",
      icon: Target,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 font-medium text-lg">
            Make the most of your tracking:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-3xl flex-shrink-0">🕐</span>
              <div>
                <strong className="text-gray-900">Log at the same time daily</strong>
                <p className="text-sm text-gray-600 mt-1">
                  Morning logging works best for most people. Set a reminder on your phone!
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-3xl flex-shrink-0">📝</span>
              <div>
                <strong className="text-gray-900">Add notes about unusual days</strong>
                <p className="text-sm text-gray-600 mt-1">
                  Stress, travel, or other changes can affect your data. Noting them helps explain outliers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-3xl flex-shrink-0">🎯</span>
              <div>
                <strong className="text-gray-900">Don't chase perfection</strong>
                <p className="text-sm text-gray-600 mt-1">
                  Missing a day or two is normal. What matters is the overall trend over time.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-3xl flex-shrink-0">📊</span>
              <div>
                <strong className="text-gray-900">Check your dashboard weekly</strong>
                <p className="text-sm text-gray-600 mt-1">
                  Review your progress every 7 days. Patterns become clearer with more data.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <IconComponent className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {currentStepData.title}
            </h2>
          </div>
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close guide"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStepData.content}
        </div>

        {/* Footer with navigation */}
        <div className="border-t bg-gray-50 p-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-blue-600"
                    : "w-2 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium"
            >
              ← Previous
            </button>

            <div className="text-sm text-gray-500 font-medium">
              Step {currentStep + 1} of {steps.length}
            </div>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={onDismiss}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-md"
              >
                Get Started! 🚀
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
