# UI Component Matrix

The three starters use stack-native components but must cover the same interaction contract.

| Component | Required states | Accessibility requirement | Showcase |
|---|---|---|---|
| Button | default, loading, disabled, danger | accessible name and focus | required |
| Input | default, error, disabled, readonly | label, description, error relation | required |
| Select | default, error, disabled, empty | label and keyboard selection | required |
| Textarea | default, error, disabled | label and character feedback when bounded | required |
| Checkbox/Radio/Switch | checked, unchecked, disabled | keyboard and accessible name | required |
| Badge/Alert | neutral, success, warning, error | not color-only | required |
| Card/PageHeader/StatCard | default, long content, empty | heading hierarchy | required |
| Modal/Drawer | open, close, loading, error | focus trap and focus restore | required |
| Dropdown/Tooltip | open, close, keyboard | escape and focus behavior | required |
| Table | loading, empty, error, data, pagination | headers and row semantics | required |
| Skeleton/Loader | loading and reduced motion | no confusing live region | required |
| Toast/Notification | success, error, warning, dismiss | live announcement and dismiss control | required |
| DatePicker | valid, invalid, disabled, empty | keyboard/date labeling | required when supported |
| FileUpload | idle, uploading, success, error, rejected | status and error announcement | required when supported |

## Propagation rule

Callers that use the shared component source inherit fixes. Raw HTML controls do not; they must be migrated before changing shared styling or behavior.
