import { NextResponse } from "next/server";
import { listSchemas } from "@/lib/engine/schema-loader";

export async function GET() {
  const workflows = await listSchemas();
  return NextResponse.json({ workflows });
}
