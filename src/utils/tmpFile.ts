import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

const withTempDir = async (fn) => {
    const dir = await fs.mkdtemp((await fs.realpath(os.tmpdir())) + path.sep);
    try {
        return await fn(dir);
    } finally {
        await fs.rm(dir, { recursive: true });
    }
};
export const withTempFile = (
    fn: (path: string) => Promise<void>
): Promise<void> => withTempDir((dir) => fn(path.join(dir, 'file')));
