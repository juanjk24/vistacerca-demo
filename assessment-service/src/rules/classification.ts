export interface AssessmentData {
  blurVision: boolean;
  eyeBurning: boolean;
  persistentSymptoms: boolean;
  highScreenTime: boolean;
}

export type Result = 'GREEN' | 'YELLOW' | 'RED';

/**
 * Reglas de clasificación SIMULADAS para el prototipo académico.
 * NO representan criterios médicos reales ni constituyen diagnóstico.
 */
export function classifyAssessment(data: AssessmentData): Result {
  let score = 0;

  if (data.blurVision) score += 2;
  if (data.eyeBurning) score += 1;
  if (data.persistentSymptoms) score += 2;
  if (data.highScreenTime) score += 1;

  if (score >= 5) return 'RED';
  if (score >= 2) return 'YELLOW';
  return 'GREEN';
}