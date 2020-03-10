export const CORE_API_ROOT = 'sessionReplay';

export const ApiNamespace = 'sessionReplay';

export const MODULE_FEATURE_HASH = 'Q';
export const WORKER_FEATURE_HASH = 'D';
export const COLLECTION_DURATION_MS = 1000;
export const IR_MUTATIONS_TTL_MS = 5000;
export const MAX_SAMPLING_RATE = 100000;

export const SESSION_STATE_V3_KEY_SESSION_ID = 'srs';
export const UI_WORKER_BRIDGE_PROTOCOL_TYPE = 'wbridge';
export const MUTATION_LIST_PROTOCOL_TYPE = 'clist';
export const LOG_PREFIX = 'sr';


export const MUTATION_ADD_NODE = 'anode';
export const MUTATION_REMOVE_NODE = 'rnode';
export const MUTATION_UPDATE_NODE = 'unode';

export const MUTATION_UPDATE_NODE_VALUE = 'unval';
export const MUTATION_UPDATE_ATTRIBUTE = 'uatt';
export const UNDEFINED = 'undefined';
export const PAIR_HANDLER = 'pair';
export const HANDSHAKE_HANDLER = 'handshake';
export const CONFIG_HANDLER = 'config';
export const MUTATION_HANDLER = 'cset';
export const EVENT_HANDLER = 'events';
export const IR_VERIFICATION_HANDLER = 'checkhandler';
export const RESET_HANDLER = 'reset';
export const INTERACTION_HANDLER = 'interaction';

export const INACTIVITY_THRESHOLD_MS = 10000;
export const INTERACTION_UPDATE_THRESHOLD_MS = 1000;

export const MASK_ENABLING_ATTRIB = 'data-dtrum-mask';

export const MASKING_NONE = 1 << 0;
export const MASKING_TEXT = 1 << 1;
export const MASKING_FIELD = 1 << 2;
export const MASKING_INTERACTION = 1 << 3;
export const MASKING_ATTRIBUTE = 1 << 4;

export const LAST_ACTIVE_VIEW_ID_LOCAL_STORAGE_KEY = 'srvid';
export const ENABLED_STATE_LOCAL_STORAGE_KEY = 'sre';
export const CURRENT_TAB_ID_SESSION_STORAGE_KEY = 'srt';

export const RECORDING_ACTIVE_STATE = 'active';
export const RECORDING_PAUSED_STATE = 'paused';
export const RECORDING_STOPPED_STATE = 'stopped';
export const RECORDING_ENDED_STATE = 'ended';

export const VISIT_RECORDING_ENABLED_STATE = 'enabled';
export const VISIT_RECORDING_DISABLED_STATE = 'disabled';

// Beware VERSION=2 is reserved for Compact Event Representation, currently
// hidden behind config prop `srcev` and by now conditionally used at
// Q_sessionrecorder/transmitter/index.js
export const SR_BEACON_PAYLOAD_VERSION = 6;
export const SR_BEACON_PAYLOAD_VERSION_COMPACTEVENTS = 2;

export const EVENTS_PAYLOAD_TYPE = 'e';
export const MUTATIONS_PAYLOAD_TYPE = 'b';


export const STATE_SUCCESS = 'success';
export const STATE_FAIL = 'fail';
export const STATUS_OK = 'OK';
export const STATUS_FAIL = 'FL(localStorage)';
export const RETRY_STORAGE_KEY = 'beaconRetry';
export const RETRY_STORAGE_VERSION = 1;
