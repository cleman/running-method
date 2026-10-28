// SessionModule catalogue (06 §2), transcribed as data. SPEC-QUESTION Q-E4: 06 §2 is a prose table with no machine form;
// this transcription is the engine's reading (trains, prereqs, effort profile, allowed phases, presets). Doses come from
// parameters.json (ses.dose.<id>.steps, 06 §2c).
import type { Effort, Node, PhaseType } from '../model/types.ts';

export interface ModuleDef {
  id: string; name: string; trains: { node: Node; level: number }[]; prereqs: { node: Node; level: number }[];
  effort_profile: Effort; allowed_phases: (PhaseType | 'BASE_LATE' | 'BUILD_LAST_THIRD')[]; presets: string[] | 'all'; why: string; long?: boolean; hills?: boolean;
}
const ALL_RUN: PhaseType[] = ['START_LADDER', 'RTR', 'ONBOARD', 'BASE', 'BUILD', 'SPECIFIC', 'SHARPEN', 'TAPER', 'RACE', 'TRANSITION', 'MAINTAIN'];
const t = (node: Node, ...levels: number[]) => levels.map(level => ({ node, level }));
export const MODULES: Record<string, ModuleDef> = {
  'SES-M-001': { id: 'SES-M-001', name: 'Easy run', trains: [...t('AER', 1, 2, 3, 4, 5), ...t('HAB', 2, 3, 4)], prereqs: t('HAB', 1), effort_profile: 'E1', allowed_phases: ALL_RUN, presets: 'all', why: 'MSG-SES-EASY' },
  'SES-M-002': { id: 'SES-M-002', name: 'Run-walk', trains: [...t('HAB', 1, 2), ...t('AER', 1)], prereqs: [], effort_profile: 'E1', allowed_phases: ALL_RUN, presets: 'all', why: 'MSG-SES-RW' },
  'SES-M-003': { id: 'SES-M-003', name: 'Long run', trains: [...t('DUR', 1, 2, 3, 4)], prereqs: [], effort_profile: 'E1', allowed_phases: ['ONBOARD', 'BASE', 'BUILD', 'SPECIFIC', 'SHARPEN', 'TAPER', 'MAINTAIN'], presets: 'all', why: 'MSG-SES-LONG', long: true },
  // SPEC-QUESTION Q-E31: 06 lists SES-M-004's prerequisite as "DUR L1 (FUEL edges, 02)"; 02 'scheduling vs attaining' says
  // those edges gate attaining FUEL L1, not the session that trains it. The engine schedules the fuelled long run without
  // DUR L1 and checks DUR L1 when FUEL L1 is attained (state.ts).
  'SES-M-004': { id: 'SES-M-004', name: 'Fuelled long run', trains: [...t('FUEL', 1, 2, 3)], prereqs: [], effort_profile: 'E1', allowed_phases: ['BASE_LATE', 'BUILD', 'SPECIFIC', 'TAPER'], presets: 'all', why: 'MSG-SES-LONG', long: true },
  'SES-M-005': { id: 'SES-M-005', name: 'Race-effort long run', trains: [...t('MSP', 1, 2, 3)], prereqs: [...t('THR', 1), ...t('DUR', 2)], effort_profile: 'E3', allowed_phases: ['SPECIFIC'], presets: 'all', why: 'MSG-SES-RACE', long: true },
  'SES-M-006': { id: 'SES-M-006', name: 'Strides', trains: [...t('VO2', 1), ...t('ECO', 1)], prereqs: t('HAB', 1), effort_profile: 'E5', allowed_phases: ['ONBOARD', 'BASE', 'BUILD', 'SPECIFIC', 'SHARPEN', 'TAPER', 'RACE', 'MAINTAIN'], presets: 'all', why: 'MSG-SES-STRIDES-SLOT' },
  'SES-M-007': { id: 'SES-M-007', name: 'Short hill sprints', trains: [...t('VO2', 1), ...t('ECO', 1)], prereqs: [...t('HAB', 2), ...t('TOL', 1)], effort_profile: 'E5', allowed_phases: ['BASE', 'BUILD'], presets: 'all', why: 'MSG-SES-STRIDES-SLOT' },
  'SES-M-008': { id: 'SES-M-008', name: 'Threshold intervals', trains: [...t('THR', 1, 2)], prereqs: [...t('AER', 1), ...t('HAB', 2)], effort_profile: 'E3', allowed_phases: ['BASE_LATE', 'BUILD', 'SPECIFIC', 'SHARPEN', 'MAINTAIN'], presets: 'all', why: 'MSG-SES-THR' },
  'SES-M-009': { id: 'SES-M-009', name: 'Continuous threshold', trains: [...t('THR', 3, 4)], prereqs: [...t('THR', 2), ...t('AER', 3)], effort_profile: 'E3', allowed_phases: ['BUILD', 'SPECIFIC', 'SHARPEN', 'MAINTAIN'], presets: ['method_default', 'daniels', 'hansons', 'pfitzinger_classic', 'koop_ultra', 'norwegian_elite'], why: 'MSG-SES-THR' },
  'SES-M-010': { id: 'SES-M-010', name: 'VO2 intervals', trains: [...t('VO2', 2, 3)], prereqs: [...t('VO2', 1), ...t('THR', 1), ...t('TOL', 2)], effort_profile: 'E4', allowed_phases: ['BUILD', 'SPECIFIC', 'SHARPEN', 'MAINTAIN'], presets: ['method_default', 'daniels', 'hansons', 'pfitzinger_classic', 'koop_ultra', 'norwegian_elite'], why: 'MSG-SES-VO2' },
  'SES-M-011': { id: 'SES-M-011', name: 'Race-pace intervals', trains: [...t('MSP', 1, 2, 3)], prereqs: [...t('THR', 1), ...t('DUR', 1)], effort_profile: 'E4', allowed_phases: ['BUILD_LAST_THIRD', 'SPECIFIC', 'SHARPEN', 'TAPER'], presets: ['method_default', 'daniels', 'hansons', 'pfitzinger_classic', 'galloway', 'koop_ultra', 'norwegian_elite', 'first'], why: 'MSG-SES-RACE' },
  'SES-M-012': { id: 'SES-M-012', name: 'Progression run', trains: [], prereqs: [...t('HAB', 2), ...t('AER', 2)], effort_profile: 'E3', allowed_phases: ['BASE_LATE', 'BUILD'], presets: ['method_default', 'daniels'], why: 'MSG-SES-THR' },
  'SES-M-013': { id: 'SES-M-013', name: 'Steady run', trains: [...t('AER', 3, 4, 5), ...t('MSP', 1, 2)], prereqs: [...t('AER', 2), ...t('TOL', 2)], effort_profile: 'E2', allowed_phases: ['BUILD', 'SPECIFIC'], presets: ['method_default', 'koop_ultra', 'pfitzinger_classic'], why: 'MSG-SES-EASY' },
  'SES-M-014': { id: 'SES-M-014', name: 'Strength', trains: t('ECO', 1), prereqs: t('HAB', 1), effort_profile: 'E0', allowed_phases: ALL_RUN, presets: 'all', why: 'MSG-WHY-SES' },
  'SES-M-018': { id: 'SES-M-018', name: 'FT-0 benchmark run', trains: t('HAB', 2), prereqs: t('HAB', 1), effort_profile: 'E1', allowed_phases: ['ONBOARD', 'RTR', 'BASE'], presets: 'all', why: 'MSG-SES-TEST' },
  'SES-M-019': { id: 'SES-M-019', name: 'FT-1 time trial', trains: [], prereqs: [...t('HAB', 2), ...t('TOL', 1)], effort_profile: 'E4', allowed_phases: ['ONBOARD', 'BASE', 'BUILD'], presets: 'all', why: 'MSG-SES-TEST' },
  'SES-M-020': { id: 'SES-M-020', name: 'FT-2 critical-speed test', trains: [], prereqs: [...t('VO2', 1), ...t('THR', 1), ...t('TOL', 2)], effort_profile: 'E4', allowed_phases: ['BASE', 'BUILD'], presets: 'all', why: 'MSG-SES-TEST' },
  'SES-M-022': { id: 'SES-M-022', name: 'Heat-exposure easy run', trains: t('HEAT', 2), prereqs: t('AER', 2), effort_profile: 'E1', allowed_phases: ['SPECIFIC', 'TAPER'], presets: 'all', why: 'MSG-NUT-HEAT' },
  'SES-M-024': { id: 'SES-M-024', name: 'Taper sharpener', trains: [], prereqs: [], effort_profile: 'E3', allowed_phases: ['TAPER'], presets: 'all', why: 'MSG-SES-THR' },
  // v5.3 (06 §2, §2d): new modules, each with a time form and a distance form (fartlek: time only)
  'SES-M-027': { id: 'SES-M-027', name: 'Short reps', trains: [...t('VO2', 2, 3), ...t('ECO', 2)], prereqs: [...t('VO2', 1), ...t('THR', 1), ...t('TOL', 2)], effort_profile: 'E4', allowed_phases: ['BUILD', 'SPECIFIC', 'SHARPEN', 'MAINTAIN'], presets: ['method_default', 'daniels', 'hansons', 'pfitzinger_classic'], why: 'MSG-SES-SHORT' },
  'SES-M-028': { id: 'SES-M-028', name: 'Hill repeats', trains: [...t('VO2', 2, 3), ...t('ECO', 2)], prereqs: [...t('VO2', 1), ...t('TOL', 2)], effort_profile: 'E4', allowed_phases: ['BASE_LATE', 'BUILD', 'SPECIFIC', 'SHARPEN', 'MAINTAIN'], presets: ['method_default', 'daniels', 'pfitzinger_classic'], why: 'MSG-SES-HILLS', hills: true },
  'SES-M-029': { id: 'SES-M-029', name: 'Fartlek', trains: t('VO2', 2), prereqs: [...t('VO2', 1), ...t('HAB', 2)], effort_profile: 'E4', allowed_phases: ['BASE_LATE', 'BUILD', 'SPECIFIC', 'SHARPEN', 'MAINTAIN'], presets: ['method_default', 'daniels', 'hansons', 'pfitzinger_classic', 'higdon_novice', 'first', 'koop_ultra', 'norwegian_elite'], why: 'MSG-SES-FARTLEK' },
  'SES-M-030': { id: 'SES-M-030', name: 'Combination threshold + VO2', trains: [...t('THR', 3, 4), ...t('VO2', 3)], prereqs: [...t('THR', 2), ...t('VO2', 2)], effort_profile: 'E4', allowed_phases: ['BUILD', 'SPECIFIC', 'SHARPEN', 'MAINTAIN'], presets: ['method_default', 'daniels', 'pfitzinger_classic'], why: 'MSG-SES-COMBO' },
  'SES-M-031': { id: 'SES-M-031', name: 'Long run with a steady finish', trains: t('PACE', 1), prereqs: [...t('DUR', 2), ...t('AER', 3)], effort_profile: 'E2', allowed_phases: ['BUILD', 'SPECIFIC'], presets: ['method_default'], why: 'MSG-SES-LONG-STEADY', long: true },
  'SES-M-026': { id: 'SES-M-026', name: 'Goal race', trains: [], prereqs: [], effort_profile: 'E4', allowed_phases: ['RACE', 'TAPER'], presets: 'all', why: 'MSG-SES-RACE' },
};
// Q-E5 (v5.3): SES-M-026 "Goal race" is now in the 06 catalogue.
