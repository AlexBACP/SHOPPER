import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe, Catch, ArgumentsHost, ExceptionFilter,
  HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

@Catch()
class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx    = host.switchToHttp();
    const res    = ctx.getResponse();
    const req    = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Siempre extraer un string — nunca devolver un objeto como message
    let message: string;
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        message = resp;
      } else if (typeof resp === 'object' && resp !== null) {
        const r = resp as Record<string, unknown>;
        const m = r['message'];
        message = Array.isArray(m) ? m.join(', ') : (typeof m === 'string' ? m : exception.message);
      } else {
        message = exception.message;
      }
    } else {
      message = exception instanceof Error ? exception.message : String(exception);
    }

    this.logger.error(`${req.method} ${req.url} → ${status}: ${message}`);
    res.status(status).json({ statusCode: status, message });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.enableCors({
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:3000').split(','),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({
    transform:            true,
    whitelist:            true,
    forbidNonWhitelisted: true,
  }));
  await app.listen(3001);
}
bootstrap();