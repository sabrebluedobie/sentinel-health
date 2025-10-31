import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import LineTile from "@/components/charts/LineTile";
import { useGlucoseData } from "@/hooks/useGlucoseData";

export default function DetailedGlucoseChart({ rangeDays = 7 }) {
  const { data: readings, loading, error } = useGlucoseData({ days: rangeDays });

  // Transform glucose readings into chart format
  const chartData = useMemo(() => {
    return readings.map(reading => ({
      x: reading.time, // already converted to Date object
      y: reading.mgdl,
    }));
  }, [readings]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-6">
        <div className="text-center text-zinc-500">Loading glucose data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-6">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">
            Glucose Log ({rangeDays}d)
          </h2>
          <p className="text-sm text-zinc-600">
            {readings.length} CGM readings
            {readings.length > 0 && ` • ${Math.round(readings.length / rangeDays)} readings/day`}
          </p>
        </div>
        <Link 
          to="/glucose" 
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Log Reading →
        </Link>
      </div>

      {readings.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          No glucose data for this time period
        </div>
      ) : (
        <LineTile 
          data={chartData}
          yDomain={[40, 250]}
          showDots={true}
          dotInterval={12}
          showAvg={true}
          avgWindow={12}
        />
      )}
    </div>
  );
}