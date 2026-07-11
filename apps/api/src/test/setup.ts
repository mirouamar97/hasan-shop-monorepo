import { config } from 'dotenv';
import path from 'node:path';
import { isDatabaseReachable } from './helpers/database';

config({ path: path.resolve(__dirname, '../../../../.env') });

declare global {
   
  var __DB_REACHABLE__: boolean;
}

globalThis.__DB_REACHABLE__ = await isDatabaseReachable();
