import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.TF_CORS_ORIGIN ?? 'http://localhost:3000' });
  app.setGlobalPrefix('api');
  const port = Number(process.env.TF_BACKEND_PORT ?? 4000);
  await app.listen(port);
  console.log(`[trust-fall] backend on :${port}`);
}
void bootstrap();