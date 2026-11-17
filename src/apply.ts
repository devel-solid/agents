import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { validateDestination } from './paths.js';
import type { SyncPlan } from './plan.js';
import { assertConsumerRoot } from './roles.js';

export function applyPlan(plan: SyncPlan): void {
  assertConsumerRoot(plan.repoRoot);
  const targets = plan.changes.map((change) => ({
    change,
    target: validateDestination(
      plan.repoRoot,
      change.path,
      change.path === 'AGENTS.md',
    ),
  }));
  for (const { change, target } of targets) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, change.content, 'utf8');
  }
}
