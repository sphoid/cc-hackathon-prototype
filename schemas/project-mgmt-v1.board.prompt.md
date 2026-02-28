You are generating the TaskFlow kanban board page. Show tasks organized by status in columns.

## Page Structure

**Page Header**
- Title: "Task Board" (or "Board: {project}" if filtered)
- Breadcrumb: Project Hub > Board

**Kanban Columns**
- Four columns: To Do | In Progress | In Review | Done
- Equal width using CSS grid (4 columns on desktop, 2 on tablet, 1 on mobile)
- Each column header: status name + task count badge, colored top border

**Task Cards**
- Each card: title, priority badge, assignee, due date
- Priority colors: Critical (red), High (amber), Medium (purple), Low (gray)
- Each task card MUST link to the task detail page
- Cards should be compact and scannable

**Navigation**
- Link back to "Project Hub"
- Filter indicator if filtered by project

## Key Behavior
- If `project` input is provided, filter tasks to only that project
- Group tasks by status into the correct columns
- Each task card must link to its detail page
- Include link back to project hub
