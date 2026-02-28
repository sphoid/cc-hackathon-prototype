import type { Metadata } from "next";
import WorkflowChat from "@/components/workflow-chat";

export const metadata: Metadata = {
  title: "ShopWave — E-Commerce Demo",
  description: "AI-powered e-commerce UI generation",
};

export default function EcommercePage() {
  return <WorkflowChat workflowId="ecommerce-v1" workflowName="E-Commerce" />;
}
