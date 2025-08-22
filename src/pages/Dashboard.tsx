// src/pages/Dashboard.tsx
import React, { useState } from "react";
import { EducationButton, EducationModal } from "@/components/Education";

export default function Dashboard() {
  const [showEducation, setShowEducation] = useState(false);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Sentinel Health Dashboard</h1>
        <div className="flex items-center gap-2">
          <EducationButton onOpen={() => setShowEducation(true)} />
        </div>
      </div>

      {/* ...rest of your dashboard... */}

      <EducationModal open={showEducation} onClose={() => setShowEducation(false)} />
    </div>
  );
}