import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(rootDir, '.env') });
const localPath = path.join(rootDir, '.env.local');
if (fs.existsSync(localPath)) {
  dotenv.config({ path: localPath, override: true });
}
