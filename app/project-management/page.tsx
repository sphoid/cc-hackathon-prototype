import type { Metadata } from "next";
import WorkflowChat from "@/components/workflow-chat";

export const metadata: Metadata = {
  title: "TaskFlow — Project Management Demo",
  description: "AI-powered project management UI generation",
};

export default function ProjectManagementPage() {
  return <WorkflowChat workflowId="project-mgmt-v1" workflowName="Project Management" />;
}
