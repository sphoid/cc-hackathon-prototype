import { promises as fs } from "fs";
import path from "path";

const dataCache = new Map<string, Record<string, unknown[]>>();

export async function loadMockData(
  workflowId: string
): Promise<Record<string, unknown[]>> {
  if (dataCache.has(workflowId)) {
    return dataCache.get(workflowId)!;
  }

  const dataDir = path.join(process.cwd(), "data", workflowId);
  const result: Record<string, unknown[]> = {};

  try {
    const files = await fs.readdir(dataDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const name = path.basename(file, ".json");
      const content = await fs.readFile(path.join(dataDir, file), "utf-8");
      result[name] = JSON.parse(content);
    }
  } catch {
    // Directory doesn't exist — return empty
  }

  dataCache.set(workflowId, result);
  return result;
}
