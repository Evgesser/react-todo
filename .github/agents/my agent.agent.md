---
name: my agent
description: Describe what this custom agent does and when to use it.
argument-hint: The inputs this agent expects, e.g., "a task to implement" or "a question to answer".
# tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo'] # specify the tools this agent can use. If not set, all enabled tools are allowed.
---
avoid any type in ts, check if some compilation errors are presents, make work in todo plan, if some errors are presents, fix it and check again until no errors are presents, then implement the plan. answer in Russian.