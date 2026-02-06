import NoInsightsAvailable from "../NoInsightsAvailable";

export default function MigraineInsightsTab({ insight }) {
  if (!insight) return <NoInsightsAvailable />;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Migraine Insight</h2>
      <pre className="bg-black/20 p-4 rounded-xl text-sm overflow-auto">
        {JSON.stringify(insight, null, 2)}
      </pre>
    </div>
  );
}
