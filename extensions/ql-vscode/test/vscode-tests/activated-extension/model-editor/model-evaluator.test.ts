import type { CodeQLCliServer } from "../../../../src/codeql-cli/cli";
import type { BaseLogger } from "../../../../src/common/logging";
import { QueryLanguage } from "../../../../src/common/query-language";
import type { DatabaseItem } from "../../../../src/databases/local-databases";
import type { ModelEvaluationRun } from "../../../../src/model-editor/model-evaluation-run";
import { ModelEvaluator } from "../../../../src/model-editor/model-evaluator";
import type { ModelingEvents } from "../../../../src/model-editor/modeling-events";
import type { ModelingStore } from "../../../../src/model-editor/modeling-store";
import type { VariantAnalysisManager } from "../../../../src/variant-analysis/variant-analysis-manager";
import { createMockLogger } from "../../../__mocks__/loggerMock";
import { createMockModelingEvents } from "../../../__mocks__/model-editor/modelingEventsMock";
import { createMockModelingStore } from "../../../__mocks__/model-editor/modelingStoreMock";
import { mockedObject } from "../../../mocked-object";

describe("Model Evaluator", () => {
  let modelEvaluator: ModelEvaluator;
  let logger: BaseLogger;
  let cliServer: CodeQLCliServer;
  let modelingStore: ModelingStore;
  let modelingEvents: ModelingEvents;
  let variantAnalysisManager: VariantAnalysisManager;
  let dbItem: DatabaseItem;
  let language: QueryLanguage;
  let updateView: jest.Mock;
  let getModelEvaluationRunMock = jest.fn();

  beforeEach(() => {
    logger = createMockLogger();
    cliServer = mockedObject<CodeQLCliServer>({});
    getModelEvaluationRunMock = jest.fn();
    modelingStore = createMockModelingStore({
      getModelEvaluationRun: getModelEvaluationRunMock,
    });
    modelingEvents = createMockModelingEvents();
    variantAnalysisManager = mockedObject<VariantAnalysisManager>({
      cancelVariantAnalysis: jest.fn(),
    });
    dbItem = mockedObject<DatabaseItem>({});
    language = QueryLanguage.Java;
    updateView = jest.fn();

    modelEvaluator = new ModelEvaluator(
      logger,
      cliServer,
      modelingStore,
      modelingEvents,
      variantAnalysisManager,
      dbItem,
      language,
      updateView,
    );
  });

  describe("stopping evaluation", () => {
    it("should just log a message if it never started", async () => {
      getModelEvaluationRunMock.mockReturnValue(undefined);

      await modelEvaluator.stopEvaluation();

      expect(logger.log).toHaveBeenCalledWith(
        "No active evaluation run to stop",
      );
    });

    it("should update the store if evaluation run exists", async () => {
      getModelEvaluationRunMock.mockReturnValue({
        isPreparing: true,
        variantAnalysisId: undefined,
      });

      await modelEvaluator.stopEvaluation();

      expect(modelingStore.updateModelEvaluationRun).toHaveBeenCalledWith(
        dbItem,
        {
          isPreparing: false,
          varianAnalysis: undefined,
        },
      );
    });

    it("should cancel the variant analysis if one has been started", async () => {
      const evaluationRun: ModelEvaluationRun = {
        isPreparing: false,
        variantAnalysisId: 123,
      };
      getModelEvaluationRunMock.mockReturnValue(evaluationRun);

      await modelEvaluator.stopEvaluation();

      expect(modelingStore.updateModelEvaluationRun).not.toHaveBeenCalled();
      expect(variantAnalysisManager.cancelVariantAnalysis).toHaveBeenCalledWith(
        evaluationRun.variantAnalysisId,
      );
    });
  });
});