import type { Metadata } from "next";
import WorkflowChat from "@/components/workflow-chat";

export const metadata: Metadata = {
  title: "LedgerLite — Bookkeeping Demo",
  description: "AI-powered bookkeeping UI generation",
};

export default function BookkeepingPage() {
  return <WorkflowChat workflowId="bookkeeping-v1" workflowName="Bookkeeping" />;
}
