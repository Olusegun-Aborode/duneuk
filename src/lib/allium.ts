import { AlliumConnector } from "./connectors/allium";

const allium = new AlliumConnector();

export async function getAlliumData(endpoint: string) {
  return allium.getData(endpoint);
}
