import { InsightCard } from "@/components/insights/InsightCard";
import NoInsightsAvailable from "../NoInsightsAvailable";

export default function MigraineInsightsTab({ insight }) {
  if (!insight) return <NoInsightsAvailable />;

  return <InsightCard insight={insight} />;
}
