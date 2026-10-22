import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ORACLE_DIR = path.resolve(here, '..');
export const REPO_DIR = path.resolve(ORACLE_DIR, '..');
export const SPEC_DIR = path.join(REPO_DIR, 'spec');
export const SCHEMA_DIR = path.join(SPEC_DIR, 'schema');
export const SPEC_FIXTURES_DIR = path.join(SPEC_DIR, 'fixtures-input');
export const ORACLE_FIXTURES_DIR = path.join(ORACLE_DIR, 'fixtures');
export const REPORTS_DIR = path.join(ORACLE_DIR, 'reports');
