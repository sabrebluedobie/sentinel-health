import { InsightCard } from "@/components/insights/InsightCard";
import NoInsightsAvailable from "../NoInsightsAvailable";

export default function PainInsightsTab({ insight }) {
  if (!insight) return <NoInsightsAvailable />;

  return <InsightCard insight={insight} />;
}
