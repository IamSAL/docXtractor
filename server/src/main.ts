/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import * as basicAuth from 'express-basic-auth';
import { TimeoutInterceptor } from './timeout-intercepter';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.use(helmet());

  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['accept'] === 'text/event-stream') {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    exposedHeaders: 'Content-Type, Content-Length, Content-Encoding',
    credentials: true,
    origin: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      // forbidNonWhitelisted: true,
      // transform: true,
    }),
  );

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalInterceptors(new TimeoutInterceptor(300000));

  // Swagger configuration
  const config = new DocumentBuilder()
    .addBearerAuth()

    .setTitle('docXtractor')
    .setDescription(
      'A comprehensive docXtractor System to extract text from documents.',
    )
    .setVersion('1.0')
    .addTag('docXtractor')
    .build();

  const swaggerUser = configService.get<string>('SWAGGER_USER') || 'admin';
  const swaggerPass = configService.get<string>('SWAGGER_PASS') || 'admin';

  app.use(
    ['/api/docs', '/api-json'],
    basicAuth({
      challenge: true,
      users: { [swaggerUser]: swaggerPass },
      realm: 'Swagger Documentation',
    }),
  );

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'none',
      operationsSorter: 'none',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
    },

    customSiteTitle: 'CRM System API Documentation',
    customCss: '.topbar { display: none; }',
  });

  // Serve swagger.json
  app.getHttpAdapter().get('/api/swagger.json', (req, res) => {
    res.json(document);
  });

  const PORT = configService.get<number>('PORT') || 8800;
  await app.listen(PORT, '0.0.0.0');
}

bootstrap();
