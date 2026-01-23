import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '../src/locales');
const enFile = path.join(localesDir, 'en.json');
const idFile = path.join(localesDir, 'id.json');

function getAllKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys = keys.concat(getAllKeys(obj[key], fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

function checkTranslations() {
    console.log('Checking translations...');

    if (!fs.existsSync(enFile) || !fs.existsSync(idFile)) {
        console.error('Translation files not found!');
        process.exit(1);
    }

    const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idFile, 'utf8'));

    const enKeys = getAllKeys(en);
    const idKeys = getAllKeys(id);

    const missingInId = enKeys.filter(key => {
        const parts = key.split('.');
        let current = id;
        for (const part of parts) {
            if (current[part] === undefined) return true;
            current = current[part];
        }
        return false;
    });

    const missingInEn = idKeys.filter(key => {
        const parts = key.split('.');
        let current = en;
        for (const part of parts) {
            if (current[part] === undefined) return true;
            current = current[part];
        }
        return false;
    });

    const emptyInEn = enKeys.filter(key => {
        const parts = key.split('.');
        let current = en;
        for (const part of parts) {
            current = current[part];
        }
        return current === '' || current === null;
    });

    const emptyInId = idKeys.filter(key => {
        const parts = key.split('.');
        let current = id;
        for (const part of parts) {
            current = current[part];
        }
        return current === '' || current === null;
    });

    let hasError = false;

    if (missingInId.length > 0) {
        console.error('\x1b[31mKeys in en.json missing in id.json:\x1b[0m');
        missingInId.forEach(key => console.error(`  - ${key}`));
        hasError = true;
    }

    if (missingInEn.length > 0) {
        console.error('\x1b[31mKeys in id.json missing in en.json:\x1b[0m');
        missingInEn.forEach(key => console.error(`  - ${key}`));
        hasError = true;
    }

    if (emptyInEn.length > 0) {
        console.warn('\x1b[33mEmpty values in en.json:\x1b[0m');
        emptyInEn.forEach(key => console.warn(`  - ${key}`));
        // We don't necessarily want to fail on empty values if they are intentional, 
        // but in this project they usually aren't. Let's make it a warning for now unless requested otherwise.
    }

    if (emptyInId.length > 0) {
        console.warn('\x1b[33mEmpty values in id.json:\x1b[0m');
        emptyInId.forEach(key => console.warn(`  - ${key}`));
    }

    if (hasError) {
        console.error('\x1b[31mTranslation check failed!\x1b[0m');
        process.exit(1);
    } else {
        console.log('\x1b[32mTranslation check passed!\x1b[0m');
    }
}

checkTranslations();
