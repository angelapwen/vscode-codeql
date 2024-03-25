import type { Meta, StoryFn } from "@storybook/react";

import { ModelAlerts as ModelAlertsComponent } from "../../view/model-alerts/ModelAlerts";
import { createMockVariantAnalysis } from "../../../test/factories/variant-analysis/shared/variant-analysis";
import type { VariantAnalysisScannedRepositoryResult } from "../../variant-analysis/shared/variant-analysis";

export default {
  title: "Model Alerts/Model Alerts",
  component: ModelAlertsComponent,
} as Meta<typeof ModelAlertsComponent>;

const Template: StoryFn<typeof ModelAlertsComponent> = (args) => (
  <ModelAlertsComponent {...args} />
);

const variantAnalysis = createMockVariantAnalysis({
  modelPacks: [
    {
      name: "Model pack 1",
      path: "/path/to/model-pack-1",
    },
    {
      name: "Model pack 2",
      path: "/path/to/model-pack-2",
    },
  ],
});

const repoResults: VariantAnalysisScannedRepositoryResult[] = (
  variantAnalysis.scannedRepos || []
).map((repo) => ({
  variantAnalysisId: variantAnalysis.id,
  repositoryId: repo.repository.id,
  interpretedResults: [],
}));

export const ModelAlerts = Template.bind({});
ModelAlerts.args = {
  initialViewState: { title: "codeql/sql2o-models" },
  variantAnalysis,
  repoResults,
};
