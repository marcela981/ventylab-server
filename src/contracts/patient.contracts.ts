/**
 * Patient Contracts – Backend
 *
 * Re-exports all patient types and constants from the simulation/patient module.
 * Other server modules should import from here rather than reaching into the module directly.
 *
 * Keep in sync with: ventilab-web/src/contracts/patient.contracts.ts
 */

// ── Types & Interfaces ──────────────────────────────────────────────────────
export {
    PatientCondition,
    type Gender,
    type PatientDemographics,
    type PatientCalculatedParams,
    type RespiratoryMechanics,
    type VitalSigns,
    type ArterialBloodGas,
    type PhysicalExam,
    type PatientModel,
    type ConfigurePatientRequest,
    type ConfigurePatientResponse,
} from '../modules/simulation/patient/patient.types';

// ── Constants ───────────────────────────────────────────────────────────────
export {
    NORMAL_RESPIRATORY_MECHANICS,
    CONDITION_MECHANICS,
    PATIENT_VALIDATION_RANGES,
} from '../modules/simulation/patient/patient.constants';
