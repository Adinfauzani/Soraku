import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FirebaseService } from '../../modules/firebase/firebase.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('anilist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with AniList OAuth code' })
  async anilistLogin(@Body('code') code: string, @Body('redirect_uri') redirectUri?: string) {
    return this.authService.loginWithAnilist(code, redirectUri);
  }

  @Get('anilist/oauth-url')
  @ApiOperation({ summary: 'Get the AniList OAuth authorize URL' })
  async anilistOAuthUrl(@Query('redirect_uri') redirectUri?: string) {
    return this.authService.getAnilistOAuthUrl(redirectUri);
  }

  @Post('anilist/connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connect an AniList account (optional, returns AniList access token)' })
  async connectAnilist(@Body('code') code: string, @Body('redirect_uri') redirectUri?: string) {
    return this.authService.connectAnilist(code, redirectUri);
  }

  @Post('anilist/track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save/update an anime on the connected AniList account' })
  async trackAnilist(
    @Body('accessToken') accessToken: string,
    @Body('mediaId') mediaId: number,
    @Body('status') status?: string,
    @Body('progress') progress?: number,
  ) {
    return this.authService.trackAnilist({ accessToken, mediaId, status, progress });
  }

  @Post('firebase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Firebase ID token (Google/Email/etc)' })
  async firebaseLogin(@Body('idToken') idToken: string) {
    const decoded = await this.firebaseService.verifyIdToken(idToken);
    return this.authService.loginWithFirebase(decoded);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh an existing token' })
  async refresh(@Body('token') token: string) {
    return this.authService.refreshToken(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Get('anilist/callback')
  @ApiOperation({ summary: 'AniList OAuth callback (redirect target)' })
  async anilistCallback(@Query('code') code: string, @Req() req: Request) {
    if (!code) throw new Error('Missing authorization code');
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/anilist/callback`;
    return this.authService.loginWithAnilist(code, redirectUri);
  }
}
