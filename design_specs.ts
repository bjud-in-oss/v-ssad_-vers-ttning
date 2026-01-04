

import { WELCOME_MD } from './specs/00_welcome';
import { PLAN_MD } from './specs/01_plan';
import { REQS_MD } from './specs/02_reqs';
import { TODO_MD } from './specs/03_todo';
import { SYSTEM_GUIDE_MD } from './specs/04_system_guide';
import { SERVER_MEETINGBRIDGE_MD } from './specs/server_meetingbridge';
import { DESIGNTANKAR_MD } from './specs/08_designtankar';
import { PROCESS_LOG_MD } from './specs/10_process_log';
import { RAG_CONTEXT_MD } from './specs/rag_context';
import { VISION_EXPANSION_MD } from './specs/vision_expansion';
import { SETTINGS_JSON } from './specs/09_settings';

// Aggregating individual files into the legacy SPECS object 
// to ensure compatibility with SpecEditor without complex refactoring.
export const SPECS: Record<string, string> = {
  '00_welcome.md': WELCOME_MD,
  '01_plan.md': PLAN_MD,
  '02_reqs.md': REQS_MD,
  '03_todo.md': TODO_MD,
  '04_system_guide.md': SYSTEM_GUIDE_MD,
  '05_rag_context.md': RAG_CONTEXT_MD,
  '06_vision_expansion.md': VISION_EXPANSION_MD,
  '07_server_meetingbridge.md': SERVER_MEETINGBRIDGE_MD,
  '08_designtankar.md': DESIGNTANKAR_MD,
  '09_settings.json': SETTINGS_JSON,
  '10_process_log.md': PROCESS_LOG_MD,
};