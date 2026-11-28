import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';
import { join } from 'path';

@Injectable()
export class PinoLoggerService implements LoggerService {
    private logger = pino({
        level: process.env.LOG_LEVEL || 'info',
        transport:
            process.env.NODE_ENV !== 'production'
                ? {
                    targets: [
                        {
                            target: 'pino-pretty',
                            options: {
                                colorize: true,
                                translateTime: 'SYS:standard',
                                ignore: 'pid,hostname',
                            },
                        },
                        {
                            target: 'pino-roll',
                            options: {
                                file: join(process.cwd(), 'logs', 'core-service.log'),
                                frequency: 'daily',
                                mkdir: true,
                                limit: { count: 30 }, // keep 30 days
                            },
                        },
                    ],
                }
                : undefined,
        base: {
            service: 'medibook-ocr-service',
            env: process.env.NODE_ENV || 'development',
        },
    });

    log(message: string, context?: string) {
        this.logger.info({ context }, message);
    }

    error(message: string, trace?: string, context?: string) {
        this.logger.error({ context, trace }, message);
    }

    warn(message: string, context?: string) {
        this.logger.warn({ context }, message);
    }

    debug(message: string, context?: string) {
        this.logger.debug({ context }, message);
    }
}