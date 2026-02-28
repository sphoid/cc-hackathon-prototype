import { WorkflowSchema } from "@/lib/types/workflow";

export function buildSystemPrompt(
  schema: WorkflowSchema,
  mockData: Record<string, unknown[]>
): string {
  const { branding, data_sources, ui_directives } = schema;

  return `${schema.prompt_context}

BRANDING:
- Brand Name: ${branding.name}
- Primary Color: ${branding.color_palette.primary}
- Secondary Color: ${branding.color_palette.secondary}
- Accent Color: ${branding.color_palette.accent}
- Background: ${branding.color_palette.background}
- Surface: ${branding.color_palette.surface}
- Text Primary: ${branding.color_palette.text_primary}
- Text Secondary: ${branding.color_palette.text_secondary}
- Destructive: ${branding.color_palette.destructive}
- Heading Font: ${branding.typography.heading_font}
- Body Font: ${branding.typography.body_font}
- Border Radius: ${branding.border_radius}

IMPORTANT STYLING RULES:
- Use inline styles for brand colors (e.g., style="background-color: ${branding.color_palette.primary}; color: white;") because Tailwind cannot reliably map arbitrary hex values.
- Use Tailwind CSS classes for layout, spacing, sizing, and responsive design (e.g., grid, flex, gap-4, p-6, rounded-lg, shadow, etc.).
- Apply font-family via inline style for headings: style="font-family: '${branding.typography.heading_font}', sans-serif;"
- Apply border-radius via inline style: style="border-radius: ${branding.border_radius};"
- Combine inline styles and Tailwind classes freely on the same element.

AVAILABLE DATA SCHEMA:
${JSON.stringify(data_sources, null, 2)}

ACTUAL DATA (use these real values in your generated UI):
${JSON.stringify(mockData, null, 2)}

UI DIRECTIVES:
- Component library: ${ui_directives.component_library}
- Output format: ${ui_directives.output_format}
- Responsive: ${ui_directives.responsive}
- Dark mode: ${ui_directives.dark_mode}

OUTPUT RULES:
1. Respond ONLY with raw HTML. No markdown, no code fences, no explanations.
2. Use the actual data provided above — real product names, real prices, real task titles, etc.
3. Generate complete, self-contained HTML fragments that can be rendered directly.
4. Use semantic HTML with proper heading hierarchy and aria labels.
5. Include a metadata HTML comment at the very end of your response in this exact format:
   <!-- METADATA: {"components_used": ["component-name-1", "component-name-2"], "query_interpretation": "Brief description of what the user asked for"} -->
6. Choose appropriate component patterns based on the user's intent:
   - Browsing/listing → grid or card layout
   - Filtering → filtered list with badge indicators
   - Comparing → side-by-side table or comparison cards
   - Detail view → single detailed card with all attributes
   - Summary/overview → dashboard with stat cards
   - Tabular data → styled table with headers
7. For images, use placeholder URLs from the data or generate placehold.co URLs.`;
}
