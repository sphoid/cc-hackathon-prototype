import { promises as fs } from "fs";
import path from "path";
import { WorkflowSchema } from "@/lib/types/workflow";

const schemaCache = new Map<string, WorkflowSchema>();

const SCHEMAS_DIR = path.join(process.cwd(), "schemas");

export async function loadAllSchemas(): Promise<void> {
  const files = await fs.readdir(SCHEMAS_DIR);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const content = await fs.readFile(path.join(SCHEMAS_DIR, file), "utf-8");
    const schema: WorkflowSchema = JSON.parse(content);
    schemaCache.set(schema.workflow_id, schema);
  }
}

export async function getSchema(
  id: string
): Promise<WorkflowSchema | undefined> {
  if (schemaCache.size === 0) {
    await loadAllSchemas();
  }
  return schemaCache.get(id);
}

export async function listSchemas(): Promise<
  { workflow_id: string; name: string; version: string }[]
> {
  if (schemaCache.size === 0) {
    await loadAllSchemas();
  }
  return Array.from(schemaCache.values()).map((s) => ({
    workflow_id: s.workflow_id,
    name: s.name,
    version: s.version,
  }));
}
