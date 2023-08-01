import {
  readQueryResults,
  runQuery,
} from "../../../../src/data-extensions-editor/external-api-usage-query";
import { createMockLogger } from "../../../__mocks__/loggerMock";
import { DatabaseKind } from "../../../../src/databases/local-databases";
import { dirSync, file } from "tmp-promise";
import { QueryResultType } from "../../../../src/query-server/new-messages";
import { fetchExternalApiQueries } from "../../../../src/data-extensions-editor/queries";
import * as log from "../../../../src/common/logging/notifications";
import { RedactableError } from "../../../../src/common/errors";
import { showAndLogExceptionWithTelemetry } from "../../../../src/common/logging";
import { QueryLanguage } from "../../../../src/common/query-language";
import { mockedUri } from "../../utils/mocking.helpers";
import { Mode } from "../../../../src/data-extensions-editor/shared/mode";

describe("runQuery", () => {
  const language = Object.keys(fetchExternalApiQueries)[
    Math.floor(Math.random() * Object.keys(fetchExternalApiQueries).length)
  ] as QueryLanguage;

  const queryDir = dirSync({ unsafeCleanup: true }).name;

  it("should log an error", async () => {
    const showAndLogExceptionWithTelemetrySpy: jest.SpiedFunction<
      typeof showAndLogExceptionWithTelemetry
    > = jest.spyOn(log, "showAndLogExceptionWithTelemetry");

    const logPath = (await file()).path;

    const query = fetchExternalApiQueries[language];
    if (!query) {
      throw new Error(`No query found for language ${language}`);
    }

    const options = {
      cliServer: {
        resolveQlpacks: jest.fn().mockResolvedValue({
          "my/extensions": "/a/b/c/",
        }),
      },
      queryRunner: {
        createQueryRun: jest.fn().mockReturnValue({
          evaluate: jest.fn().mockResolvedValue({
            resultType: QueryResultType.CANCELLATION,
          }),
          outputDir: {
            logPath,
          },
        }),
        logger: createMockLogger(),
      },
      databaseItem: {
        databaseUri: mockedUri("/a/b/c/src.zip"),
        contents: {
          kind: DatabaseKind.Database,
          name: "foo",
          datasetUri: mockedUri(),
        },
        language,
      },
      queryStorageDir: "/tmp/queries",
      queryDir,
      progress: jest.fn(),
      token: {
        isCancellationRequested: false,
        onCancellationRequested: jest.fn(),
      },
    };

    expect(await runQuery(Mode.Application, options)).toBeUndefined();
    expect(showAndLogExceptionWithTelemetrySpy).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      expect.any(RedactableError),
    );
  });

  it("should run query for random language", async () => {
    const logPath = (await file()).path;

    const query = fetchExternalApiQueries[language];
    if (!query) {
      throw new Error(`No query found for language ${language}`);
    }

    const options = {
      cliServer: {
        resolveQlpacks: jest.fn().mockResolvedValue({
          "my/extensions": "/a/b/c/",
        }),
      },
      queryRunner: {
        createQueryRun: jest.fn().mockReturnValue({
          evaluate: jest.fn().mockResolvedValue({
            resultType: QueryResultType.SUCCESS,
          }),
          outputDir: {
            logPath,
          },
        }),
        logger: createMockLogger(),
      },
      databaseItem: {
        databaseUri: mockedUri("/a/b/c/src.zip"),
        contents: {
          kind: DatabaseKind.Database,
          name: "foo",
          datasetUri: mockedUri(),
        },
        language,
      },
      queryStorageDir: "/tmp/queries",
      queryDir,
      progress: jest.fn(),
      token: {
        isCancellationRequested: false,
        onCancellationRequested: jest.fn(),
      },
    };

    const result = await runQuery(Mode.Framework, options);

    expect(result?.resultType).toEqual(QueryResultType.SUCCESS);

    expect(options.cliServer.resolveQlpacks).toHaveBeenCalledTimes(1);
    expect(options.cliServer.resolveQlpacks).toHaveBeenCalledWith([], true);
    expect(options.queryRunner.createQueryRun).toHaveBeenCalledWith(
      "/a/b/c/src.zip",
      {
        queryPath: expect.stringMatching(/FetchExternalApis\S*\.ql/),
        quickEvalPosition: undefined,
        quickEvalCountOnly: false,
      },
      false,
      [],
      ["my/extensions"],
      "/tmp/queries",
      undefined,
      undefined,
    );
  });
});

describe("readQueryResults", () => {
  const options = {
    cliServer: {
      bqrsInfo: jest.fn(),
      bqrsDecode: jest.fn(),
    },
    bqrsPath: "/tmp/results.bqrs",
  };

  let showAndLogExceptionWithTelemetrySpy: jest.SpiedFunction<
    typeof showAndLogExceptionWithTelemetry
  >;

  beforeEach(() => {
    showAndLogExceptionWithTelemetrySpy = jest.spyOn(
      log,
      "showAndLogExceptionWithTelemetry",
    );
  });

  it("returns undefined when there are no results", async () => {
    options.cliServer.bqrsInfo.mockResolvedValue({
      "result-sets": [],
    });

    expect(await readQueryResults(options)).toBeUndefined();
    expect(showAndLogExceptionWithTelemetrySpy).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      expect.any(RedactableError),
    );
  });

  it("returns undefined when there are multiple result sets", async () => {
    options.cliServer.bqrsInfo.mockResolvedValue({
      "result-sets": [
        {
          name: "#select",
          rows: 10,
          columns: [
            { name: "usage", kind: "e" },
            { name: "apiName", kind: "s" },
            { kind: "s" },
            { kind: "s" },
          ],
        },
        {
          name: "#select2",
          rows: 10,
          columns: [
            { name: "usage", kind: "e" },
            { name: "apiName", kind: "s" },
            { kind: "s" },
            { kind: "s" },
          ],
        },
      ],
    });

    expect(await readQueryResults(options)).toBeUndefined();
    expect(showAndLogExceptionWithTelemetrySpy).toHaveBeenCalledWith(
      expect.anything(),
      undefined,
      expect.any(RedactableError),
    );
  });

  it("gets the result set", async () => {
    options.cliServer.bqrsInfo.mockResolvedValue({
      "result-sets": [
        {
          name: "#select",
          rows: 10,
          columns: [
            { name: "usage", kind: "e" },
            { name: "apiName", kind: "s" },
            { kind: "s" },
            { kind: "s" },
          ],
        },
      ],
      "compatible-query-kinds": ["Table", "Tree", "Graph"],
    });
    const decodedResultSet = {
      columns: [
        { name: "usage", kind: "e" },
        { name: "apiName", kind: "s" },
        { kind: "s" },
        { kind: "s" },
      ],
      tuples: [
        [
          "java.io.PrintStream#println(String)",
          true,
          {
            label: "println(...)",
            url: {
              uri: "file:/home/runner/work/sql2o-example/sql2o-example/src/main/java/org/example/HelloController.java",
              startLine: 29,
              startColumn: 9,
              endLine: 29,
              endColumn: 49,
            },
          },
        ],
      ],
    };
    options.cliServer.bqrsDecode.mockResolvedValue(decodedResultSet);

    const result = await readQueryResults(options);
    expect(result).toEqual(decodedResultSet);
    expect(options.cliServer.bqrsInfo).toHaveBeenCalledWith(options.bqrsPath);
    expect(options.cliServer.bqrsDecode).toHaveBeenCalledWith(
      options.bqrsPath,
      "#select",
    );
  });
});
