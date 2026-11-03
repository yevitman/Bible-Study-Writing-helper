export interface IceBreaker {
  title: string;
  question: string;
  illustration: string;
}

export interface HistoricalContext {
  background: string;
  theologicalTheme: string;
}

export interface WordStudy {
  originalWord: string;
  meaning: string;
  insight: string;
}

export interface OutlinePoint {
  pointNumber: number;
  title: string;
  verses: string;
  exegesis: string;
  modernAnalogy?: string;
  discussionQuestion: string;
}

export interface DeepQuestions {
  observation: string[];
  interpretation: string[];
  application: string[];
}

export interface LifeApplication {
  domain: string;
  actionItem: string;
}

export interface ParticipantHandout {
  summary: string;
  fillInTheBlanks: string[];
  weeklyMission: string;
}

export interface BibleStudyManuscript {
  id: string;
  title: string;
  subtitle: string;
  passage: string;
  keyVerse: string;
  targetAudience: string;
  studyType?: string;
  tone?: string;
  estimatedTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  iceBreaker: IceBreaker;
  historicalContext: HistoricalContext;
  wordStudies: WordStudy[];
  outlines: OutlinePoint[];
  deepQuestions: DeepQuestions;
  lifeApplication: LifeApplication[];
  closingPrayer: string;
  participantHandout: ParticipantHandout;
}

export type ViewMode = 'leader' | 'handout' | 'teleprompter' | 'split';
