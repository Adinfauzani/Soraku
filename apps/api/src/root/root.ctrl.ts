import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';

@ApiTags('root')
@Controller()
export class RootController {
  @Get()
  @ApiOperation({ summary: 'API root info' })
  root(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Soraku API</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      height: 100vh;
      width: 100vw;
      background: #0a0a0a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      overflow: hidden;
    }
    .container {
      text-align: center;
    }
    h1 {
      font-size: 4rem;
      font-weight: 900;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: -2px;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: welcomeFloat 3s ease-in-out infinite;
    }
    span {
      animation: welcomePulse 2s ease-in-out infinite;
    }
    .subtitle {
      font-size: 1.2rem;
      color: #888;
      margin-top: 1rem;
      animation: fadeInUp 1s ease forwards;
    }
    @keyframes welcomeFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes welcomePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.05); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome <span>To</span> Sorabe</h1>
    <p class="subtitle">Soraku API is online</p>
  </div>
</body>
</html>
    `);
  }
}
