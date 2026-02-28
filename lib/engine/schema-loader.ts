import { promises as fs } from "fs";
import path from "path";
import { WorkflowSchema } from "@/lib/types/workflow";

const schemaCache = new Map<string, WorkflowSchema>();

const SCHEMAS_DIR = path.join(process.cwd(), "schemas");

async function readPromptFile(filename: string): Promise<string | null> {
  try {
    return await fs.readFile(path.join(SCHEMAS_DIR, filename), "utf-8");
  } catch {
    return null;
  }
}

export async function loadAllSchemas(): Promise<void> {
  const basePrompt = await readPromptFile("base.prompt.md");

  const files = await fs.readdir(SCHEMAS_DIR);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const content = await fs.readFile(path.join(SCHEMAS_DIR, file), "utf-8");
    const schema: WorkflowSchema = JSON.parse(content);

    const schemaPrompt = await readPromptFile(
      `${schema.workflow_id}.prompt.md`
    );

    if (basePrompt || schemaPrompt) {
      schema.prompt_context = [basePrompt, schemaPrompt]
        .filter(Boolean)
        .join("\n\n---\n\n");
    }

    // Load sub-workflow prompt contexts
    if (schema.sub_workflows) {
      for (const [subId, subWorkflow] of Object.entries(schema.sub_workflows)) {
        const subPrompt = await readPromptFile(
          `${schema.workflow_id}.${subId}.prompt.md`
        );
        // Use sub-workflow-specific prompt, fall back to main schema prompt
        const resolvedPrompt = subPrompt || schemaPrompt;
        subWorkflow.prompt_context = [basePrompt, resolvedPrompt]
          .filter(Boolean)
          .join("\n\n---\n\n");
      }
    }

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
