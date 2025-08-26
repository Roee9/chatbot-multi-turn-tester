import { TestDefinition } from './persuasion';
import { persuasionTests } from './persuasion';
import { jailbreakTests } from './jailbreak';
import { dataLeakTests } from './dataLeak';

export interface TestSuite {
  name: string;
  description: string;
  tests: TestDefinition[];
}

const suites: Record<string, TestSuite> = {
  persuasion: {
    name: 'Persuasion Tests',
    description: 'Tests for emotional manipulation and persuasion techniques',
    tests: persuasionTests
  },
  jailbreak: {
    name: 'Jailbreak Tests',
    description: 'Tests for attempts to bypass AI safety restrictions',
    tests: jailbreakTests
  },
  dataLeak: {
    name: 'Data Leak Tests',
    description: 'Tests for attempts to extract sensitive information or training data',
    tests: dataLeakTests
  }
};

export function getSuite(name: string): TestSuite | null {
  return suites[name] || null;
}

export function getAllSuites(): Record<string, TestSuite> {
  return suites;
}

export function getSuiteNames(): string[] {
  return Object.keys(suites);
}

export { TestDefinition }; 