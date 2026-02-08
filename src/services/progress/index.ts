// ============================================
// PROGRESS SERVICES - CENTRALIZED EXPORTS
// ============================================
//
// IMPORTANT: Use unifiedProgress.service for all new code.
// The other services are kept for backward compatibility.

// PRIMARY: Unified Progress Service (USE THIS FOR NEW CODE)
export * from './unifiedProgress.service';

// Legacy services (kept for backward compatibility)
export * from './progressQuery.service';
export * from './progressUpdate.service';
export * from './levelCalculation.service';
export * from './achievements.service';

// Types
export * from '../../types/progress';

