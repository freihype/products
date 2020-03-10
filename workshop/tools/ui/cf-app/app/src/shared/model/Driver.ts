export enum DRIVER_FLAGS {
    NONE = 0,
    /**
     * Mark the driver for "server side"
     */
    RUNS_ON_SERVER = 2,
    /**
     * Enable protocol's debug message on console
     */
    DEBUG = 4,
    /**
     * Enable protocol's debug message on console
     */
    SERVER = 16
};

export enum DRIVER_PROPERTY {
    CF_DRIVER_NAME = 'CF_DRIVER_NAME',
    CF_DRIVER_ICON = 'CF_DRIVER_ICON',
    CF_DRIVER_CLASS = 'CF_DRIVER_CLASS',
    CF_DRIVER_ID = 'CF_DRIVER_ID',
    CF_DRIVER_COMMANDS = 'CF_DRIVER_COMMANDS',
    CF_DRIVER_VARIABLES = 'CF_DRIVER_VARIABLES',
    CF_DRIVER_RESPONSES = 'CF_DRIVER_RESPONSES'
};