export interface SimulationResponse {
  simulationText: string;
  error?: string;
}

export type SimulationSection = 'overview' | 'complainant' | 'respondent' | 'evidence' | 'legal' | 'conclusion' | 'case';

export type ResponsibleParty = 'Respondent' | 'Complainant' | 'Both Parties' | 'Neither Party';

export type MisconductType = 'Sexual Harassment' | 'Discrimination' | 'Retaliation' | 'No Misconduct';

export type PrimaryMotivation = 
  // New motivations based on SCENARIO_GENERATION
  // 'Power preservation' | 'Retaliation' | 'Jealousy' | 'Gender-based prejudice' |
  // Original motivations for backward compatibility
  'Genuine Complaint' | 'Personal Vendetta' | 'Career Advancement' | 'Misunderstanding';

export interface ConclusionData {
  responsibleParty: ResponsibleParty;
  misconductType: MisconductType;
  primaryMotivation: PrimaryMotivation;
}

export interface WitnessStatement {
  name?: string;
  statement?: string;
}

export interface SimulationData {
  caseOverview: string;
  complainantStatement: string;
  respondentStatement: string;
  witnessStatements?: string | WitnessStatement[] | Record<string, string>;
  additionalEvidence: string;
  legalReferenceGuide: string;
  correctResponsibleParty: ResponsibleParty;
  correctMisconductType: MisconductType;
  correctPrimaryMotivation: PrimaryMotivation;
  analysis: string;
}

// For backwards compatibility with the markdown format
export interface MarkdownSimulationData {
  case: string;
  evidence: string;
  legal: string;
  hiddenInfo?: string;
} 