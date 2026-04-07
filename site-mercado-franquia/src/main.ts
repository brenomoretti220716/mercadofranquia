import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NextFunction, Request, Response } from 'express';
import { existsSync, readdirSync } from 'fs';
import { networkInterfaces } from 'os';
import { join } from 'path';
import { AppModule } from './app.module';

function getLocalIPv4(): string | undefined {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    const addrs = nets[name] || [];
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }
  return undefined;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Swagger/OpenAPI config
  const config = new DocumentBuilder()
    .setTitle('Franchise API')
    .setDescription('Documentação da API de franquias')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Serve OpenAPI JSON
  app.getHttpAdapter().get('/api-docs/json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  // Serve Scalar API Reference
  app.getHttpAdapter().get('/api-docs', (req: Request, res: Response) => {
    res.send(`
      <!doctype html>
        <html>
          <head>
            <title>Franchise API Documentation</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body>
            <script
              id="api-reference"
              data-url="/api-docs/json"
              data-configuration='{"theme":"mars","layout":"modern","defaultHttpClient":{"targetKey":"javascript","clientKey":"fetch"},"customCss":".scalar-card { border-radius: 12px; }"}'
            ></script>
            <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@latest/dist/browser/standalone.js"></script>
          </body>
        </html>`);
  });

  app.enableCors({
    origin: [
      'http://192.168.1.101:3000',
      'http://162.215.10.70:3516',
      'http://localhost:3000',
      'https://franchise.mindconsulting.com.br',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const uploadsPath = join(process.cwd(), 'uploads');
  const newsPath = join(uploadsPath, 'news');

  console.log('=== DIRECTORY DEBUG ===');
  console.log('Current working directory:', process.cwd());
  console.log('__dirname:', __dirname);
  console.log('Uploads path:', uploadsPath);
  console.log('Uploads exists:', existsSync(uploadsPath));
  console.log('News path:', newsPath);
  console.log('News exists:', existsSync(newsPath));

  if (existsSync(uploadsPath)) {
    console.log('Files in uploads:', readdirSync(uploadsPath));
  }

  if (existsSync(newsPath)) {
    console.log('Files in news:', readdirSync(newsPath));
  }
  console.log('=====================');

  // Middleware de debug
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    const requestedFile = join(uploadsPath, req.url);
    console.log('=== REQUEST DEBUG ===');
    console.log('Requested URL:', req.url);
    console.log('Full path:', requestedFile);
    console.log('File exists:', existsSync(requestedFile));
    console.log('==================');
    next();
  });

  // Configurar arquivos estáticos
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
    index: false,
  });

  const port: number = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0', () => {
    const hostIp = getLocalIPv4() || 'unknown';
    console.log(`Server running on ip: ${hostIp} port: ${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
