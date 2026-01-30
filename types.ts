
export type Language = 'Python' | 'Bash' | 'PowerShell' | 'JavaScript' | 'TypeScript' | 'Go' | 'Ruby' | 'Auto' | 'YAML' | 'JSON';
export type Environment = 'Linux' | 'Windows' | 'macOS' | 'AWS' | 'Azure' | 'GCP' | 'Docker' | 'Kubernetes' | 'Generic';
export type SafetyLevel = 'Dry Run Only' | 'Normal (Recommended)' | 'Production (Strict)';
export type ScriptType = 'Automation' | 'Workflow' | 'Integration' | 'Business Logic' | 'DevOps' | 'Data Processing';

export interface FailureSimulation {
  scenario: string;
  trigger: string;
  behavior: string;
}

export interface ValueMetrics {
  timeSavedMinutes: number;
  linesProduced: number;
  potentialErrorsMitigated: number;
}

export interface ScriptRequest {
  description: string;
  language: Language;
  environment: Environment;
  safetyLevel: SafetyLevel;
  scriptType: ScriptType;
  includeTests: boolean;
}

export interface ScriptResponse {
  summary: string;
  assumptions: string[];
  script: string;
  tests?: string;
  dockerfile?: string;
  cicd?: string;
  failureSimulations: FailureSimulation[];
  metrics: ValueMetrics;
  usage: string;
}
