import type { Logger } from "@elgato/utils/logging";

export function logErrorAndThrow(logger: Logger, error: string): Error {
    logger.error(error);
    return new Error(error);
}