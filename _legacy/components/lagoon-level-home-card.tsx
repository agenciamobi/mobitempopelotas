import { PelotasHydrologyWidget } from "@/components/pelotas-hydrology-widget";

export async function LagoonLevelHomeCard() {
  return (
    <PelotasHydrologyWidget
      headingLevel="h2"
      className="pelotas-hydrology-widget--home"
    />
  );
}
