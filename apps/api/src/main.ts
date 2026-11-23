import 'dotenv/config';
import './dns-fix';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverless from 'serverless-http';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';

let cachedApp: express.Express;

function getCorsOrigins() {
  const origins = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.includes('*') ? undefined : origins;
}

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.enableCors({ origin: getCorsOrigins(), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Soraku API')
    .setDescription('Anime streaming orchestration engine by Rynex Studio')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  expressApp.use('/api/docs', swaggerUi.serve, swaggerUi.setup(document));

  await app.init();
  return expressApp;
}

export const handler = async (event: any, context: any) => {
  cachedApp = cachedApp ?? (await bootstrap());
  return serverless(cachedApp)(event, context);
};

if (!process.env.VERCEL) {
  bootstrap()
    .then((expressApp) => {
      const port = Number(process.env.PORT) || 3001;
      expressApp.listen(port, '0.0.0.0', (err?: Error) => {
        if (err) {
          console.error(`Failed to start server on port ${port}:`, err.message);
          process.exit(1);
        }
        console.log(`Soraku API running on http://localhost:${port}`);
        console.log(`Swagger docs at http://localhost:${port}/api/docs`);
      });
    })
    .catch((err) => {
      console.error('Failed to bootstrap application:', err);
      process.exit(1);
    });
}
