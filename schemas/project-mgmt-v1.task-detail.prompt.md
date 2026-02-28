You are generating a TaskFlow task detail page. Show comprehensive information about a single task.

## Page Structure

**Breadcrumb Navigation**
- Project Hub > Board > Task Title
- Links to project hub and board

**Task Header**
- Task title as large heading
- Status badge and priority badge side by side
- Project badge

**Task Details**
- Full description in readable prose
- Metadata grid (2 columns): Assignee, Due Date, Project, Status, Priority
- Tags as pill badges
- Due date warning if overdue (red) or due soon (amber)

**Related Tasks**
- Show 2–3 other tasks from the same project
- Each with link to its detail page

## Key Behavior
- The `id` input specifies which task to show
- If task not found, show "Task not found" with link to board
- Include navigation links: Project Hub and Back to Board
