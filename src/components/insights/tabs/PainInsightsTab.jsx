import NoInsightsAvailable from "../NoInsightsAvailable";

export default function PainInsightsTab({ insight }) {
  if (!insight) return <NoInsightsAvailable />;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Pain Insight</h2>
      <pre className="bg-black/20 p-4 rounded-xl text-sm overflow-auto">
        {JSON.stringify(insight, null, 2)}
      </pre>
    </div>
  );
}
