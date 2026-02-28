export interface SubWorkflowInput {
  name: string;
  type: "string" | "number";
  required?: boolean;
  description: string;
}

export interface SubWorkflowRoute {
  sub_workflow_id: string;
  label: string;
  description: string;
}

export interface SubWorkflow {
  name: string;
  prompt_context: string;
  is_entry_point?: boolean;
  auto_generate_query?: string;
  inputs: SubWorkflowInput[];
  routes_to: SubWorkflowRoute[];
}

export interface WorkflowSchema {
  workflow_id: string;
  name: string;
  version: string;
  branding: BrandingConfig;
  data_sources: Record<string, DataSource>;
  ui_directives: UIDirectives;
  prompt_context: string;
  sub_workflows?: Record<string, SubWorkflow>;
}

export interface BrandingConfig {
  name: string;
  logo_url?: string;
  typography: {
    heading_font: string;
    body_font: string;
    mono_font?: string;
  };
  color_palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text_primary: string;
    text_secondary: string;
    destructive: string;
  };
  border_radius: string;
}

export interface DataSource {
  type: "mock" | "api";
  schema: Record<string, string>;
}

export interface UIDirectives {
  component_library: string;
  output_format: string;
  responsive: boolean;
  dark_mode: boolean;
}
