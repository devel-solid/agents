import { existsSync, statSync } from 'node:fs';
import { EngineError, loadManifest } from './manifest.js';
import { safeJoin } from './paths.js';
import { inspectIntegration } from './init.js';
import { git } from './resolve.js';

export interface Diagnostic {
  code: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  field?: string;
  location?: { path: string; line: number; column: number };
  remediation?: string;
}

export function diagnose(repoRoot: string, base = false): Diagnostic[] {
  const diagnostics: Diagnostic[] = [
    {
      code: 'RUNTIME',
      severity: [22, 24, 26].includes(
        Number(process.versions.node.split('.')[0]),
      )
        ? 'info'
        : 'error',
      message: `Node.js ${process.versions.node}.`,
    },
  ];
  if (!existsSync(repoRoot) || !statSync(repoRoot).isDirectory()) {
    diagnostics.push({
      code: 'PROJECT_ROOT',
      severity: 'error',
      message: `Raiz ausente ou inválida: ${repoRoot}.`,
    });
    return diagnostics;
  }
  try {
    if (!base) {
      const { data } = loadManifest(repoRoot);
      diagnostics.push({
        code: 'MANIFEST',
        severity: 'info',
        message: `Manifesto válido, versão ${data.schemaVersion ?? 1}.`,
      });
      safeJoin(
        repoRoot,
        data.outputs['AGENTS.md'].include.conventions.local.tpl_dir,
        'local.tpl_dir',
      );
      if (data.agents) {
        const result = git(['--version']);
        diagnostics.push({
          code: 'GIT',
          severity: 'info',
          message: result,
        });
      }
      const integration = inspectIntegration(repoRoot);
      diagnostics.push({
        code: 'INTEGRATION',
        severity:
          integration === 'conflict'
            ? 'error'
            : integration === 'missing'
              ? 'warning'
              : 'info',
        message: `Integração agents-update-docs: ${integration}.`,
        remediation:
          integration === 'missing'
            ? 'Use agents init se quiser instalar a skill para o agente.'
            : integration === 'conflict'
              ? 'Revise a skill personalizada antes de substituir sua integração.'
              : undefined,
      });
    }
  } catch (error) {
    if (!(error instanceof EngineError)) throw error;
    diagnostics.push({
      code: error.code,
      severity: 'error',
      message: error.message,
      field: error.field,
      location: error.location,
      remediation: error.remediation,
    });
  }
  return diagnostics;
}
