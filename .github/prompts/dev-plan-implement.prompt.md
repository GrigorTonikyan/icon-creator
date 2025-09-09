---
mode: 'agent'
model: Claude Sonnet 4
tools: ['runCommands', 'edit', 'search', 'usages', 'think', 'problems', 'testFailure', 'fetch', 'githubRepo', 'todos', 'sequential-thinking', 'context7']
description: 'implement stage from dev-plan file.'
---
Your goal is to implement #sym ${input:stageToImplement:stage-01} from dev-plan #file:draft.backend.md based on the templates in #githubRepo contoso/react-templates.

Ask for the form name and fields if not provided.

Requirements for the form:
* Use form design system components: [design-system/Form.md](../docs/design-system/Form.md)
* Use `react-hook-form` for form state management:
* Always define TypeScript types for your form data
* Prefer *uncontrolled* components using register
* Use `defaultValues` to prevent unnecessary rerenders
* Use `yup` for validation:
* Create reusable validation schemas in separate files
* Use TypeScript types to ensure type safety
* Customize UX-friendly validation rules


```markdown
#file:draft.backend.md    start implementing `dev-plan` from
#sym:### stage-16: E-Commerce SPA Integration (WEC)  
 . REMEMBER TO:
- double check steps mark as done, to ensure proper implementation.
- mark all complated steps as done
- update status of implementation in dev-plan.

#codebase 
```
