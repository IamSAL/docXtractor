import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

const REDACTED = '[REDACTED]';
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'authorization',
]);

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k) ? REDACTED : sanitize(v),
    ]),
  );
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const { method, url, body } = req;
    const userId: string | undefined = (req as any).user?.id;
    const start = Date.now();

    const reqBody =
      body && Object.keys(body).length ? sanitize(body) : undefined;
    if (reqBody) {
      this.logger.log(`→ ${method} ${url} body=${JSON.stringify(reqBody)}`);
    }

    return next.handle().pipe(
      tap({
        next: (resBody: unknown) => {
          const ms = Date.now() - start;
          const status = res.statusCode;
          const user = userId ? ` uid=${userId}` : '';
          const sanitized = sanitize(resBody);
          this.logger.log(
            `← ${method} ${url} ${status} ${ms}ms${user} body=${JSON.stringify(sanitized)}`,
          );
        },
        error: (err: { status?: number; message?: string }) => {
          const ms = Date.now() - start;
          const status = err?.status ?? 500;
          const user = userId ? ` uid=${userId}` : '';
          this.logger.error(
            `← ${method} ${url} ${status} ${ms}ms${user} err=${err?.message ?? 'unknown'}`,
          );
        },
      }),
    );
  }
}
