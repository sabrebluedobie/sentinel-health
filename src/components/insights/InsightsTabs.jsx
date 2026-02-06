import { useState } from "react";

import GlucoseInsightsTab from "./tabs/GlucoseInsightsTab";
import MigraineInsightsTab from "./tabs/MigraineInsightsTab";
import PainInsightsTab from "./tabs/PainInsightsTab";
import SleepInsightsTab from "./tabs/SleepInsightsTab";

export default function InsightsTabs({ elementInsights = {} }) {
  const [activeTab, setActiveTab] = useState("migraines");

  const tabs = [
    { id: "migraines", label: "Migraines" },
    { id: "glucose", label: "Glucose" },
    { id: "sleep", label: "Sleep" },
    { id: "pain", label: "Pain" },
  ];

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
        {activeTab === "migraines" && (
          <MigraineInsightsTab insight={elementInsights.migraines} />
        )}

        {activeTab === "glucose" && (
          <GlucoseInsightsTab insight={elementInsights.glucose} />
        )}

        {activeTab === "sleep" && (
          <SleepInsightsTab insight={elementInsights.sleep} />
        )}

        {activeTab === "pain" && (
          <PainInsightsTab insight={elementInsights.pain} />
        )}
      </div>
    </div>
  );
}
