import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { resolve } from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;

  onModuleInit() {
    if (admin.apps.length > 0) {
      this.app = admin.apps[0]!;
      return;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
      try {
        const credential = JSON.parse(serviceAccountJson);
        this.app = admin.initializeApp({
          credential: admin.credential.cert(credential),
        });
        this.logger.log('Firebase initialized from env var');
      } catch (e) {
        this.logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON', e);
        this.app = admin.initializeApp();
      }
    } else {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      if (serviceAccountPath) {
        try {
          const credential = require(resolve(serviceAccountPath));
          this.app = admin.initializeApp({
            credential: admin.credential.cert(credential),
          });
          this.logger.log(`Firebase initialized from ${serviceAccountPath}`);
        } catch (e) {
          this.logger.error(`Failed to load service account from ${serviceAccountPath}`, e);
          this.app = admin.initializeApp();
        }
      } else {
        this.app = admin.initializeApp();
        this.logger.log('Firebase initialized with default credentials');
      }
    }
  }

  get auth(): admin.auth.Auth {
    return this.app.auth();
  }

  get firestore(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  get messaging(): admin.messaging.Messaging {
    return this.app.messaging();
  }

  async verifyIdToken(token: string) {
    this.logger.debug(`Verifying ID token (first 20 chars): ${token?.substring(0, 20)}...`);
    try {
      const result = await this.auth.verifyIdToken(token);
      this.logger.log('Token verified successfully');
      return result;
    } catch (e) {
      this.logger.error('Token verification failed', e);
      throw e;
    }
  }

  async createCustomToken(uid: string) {
    return this.auth.createCustomToken(uid);
  }
}
