import type { Metadata } from "next";
import SubWorkflowPage from "@/components/sub-workflow-page";

export const metadata: Metadata = {
  title: "ShopWave — E-Commerce Demo",
  description: "AI-powered e-commerce UI generation",
};

export default async function EcommerceCatchAll({
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
      workflowId="ecommerce-v1"
      workflowName="E-Commerce"
      subWorkflowId={subWorkflowId}
      basePath="/ecommerce"
      inputs={inputs}
    />
  );
}
