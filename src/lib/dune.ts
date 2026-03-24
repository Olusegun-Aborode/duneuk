import { DuneConnector } from "@datumlabs/data-connectors";

const dune = new DuneConnector({
  defaultLimit: 5000,
});

export async function getDuneQueryResults(queryId: number) {
  const result = await dune.getQueryResults(queryId, 5000);
  return {
    data: result.data,
    lastUpdated: result.lastUpdated,
  };
}
