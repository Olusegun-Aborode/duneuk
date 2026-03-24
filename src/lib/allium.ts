import { AlliumConnector } from "@datumlabs/data-connectors";

const allium = new AlliumConnector();

export async function getAlliumData(endpoint: string) {
  return allium.getData(endpoint);
}
