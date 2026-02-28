import type { Metadata } from "next";
import SubWorkflowPage from "@/components/sub-workflow-page";

export const metadata: Metadata = {
  title: "TaskFlow — Project Management Demo",
  description: "AI-powered project management UI generation",
};

export default async function ProjectManagementCatchAll({
  params,
  searchParams,
}: {
  params: Promise<{ sub?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sub } = await params;
  const resolvedSearchParams = await searchParams;

  const subWorkflowId = sub?.[0] || "entry-point";
  const inputs: Record<string, string> = {};
  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === "string") {
      inputs[key] = value;
    }
  }

  return (
    <SubWorkflowPage
      workflowId="project-mgmt-v1"
      workflowName="Project Management"
      subWorkflowId={subWorkflowId}
      basePath="/project-management"
      inputs={inputs}
    />
  );
}
