
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/locales');

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

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath));
        } else {
            if (file === 'en.json' || file === 'id.json') {
                results.push(filePath);
            }
        }
    });
    return results;
}

function checkFilePair(dirPath) {
    const enPath = path.join(dirPath, 'en.json');
    const idPath = path.join(dirPath, 'id.json');

    // Check existence
    const enExists = fs.existsSync(enPath);
    const idExists = fs.existsSync(idPath);

    if (enExists && !idExists) {
        console.error(`\x1b[31mMissing id.json in ${dirPath}\x1b[0m`);
        return false;
    }
    if (!enExists && idExists) {
        console.error(`\x1b[31mMissing en.json in ${dirPath}\x1b[0m`);
        return false;
    }
    if (!enExists && !idExists) return true; // Should not happen given logic, but OK.

    console.log(`Checking ${path.relative(localesDir, dirPath)}...`);

    let enData = {}, idData = {};
    try {
        enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
        idData = JSON.parse(fs.readFileSync(idPath, 'utf8'));
    } catch (e) {
        console.error(`\x1b[31mError parsing JSON in ${dirPath}: ${e.message}\x1b[0m`);
        return false;
    }

    const enKeys = getAllKeys(enData);
    const idKeys = getAllKeys(idData);

    let hasError = false;

    // Check missing keys
    const missingInId = enKeys.filter(key => !idKeys.includes(key));
    const missingInEn = idKeys.filter(key => !enKeys.includes(key));

    if (missingInId.length > 0) {
        console.error(`\x1b[31mKeys in en.json missing in id.json (${path.relative(localesDir, enPath)}):\x1b[0m`);
        missingInId.forEach(key => console.error(`  - ${key}`));
        hasError = true;
    }

    if (missingInEn.length > 0) {
        console.error(`\x1b[31mKeys in id.json missing in en.json (${path.relative(localesDir, idPath)}):\x1b[0m`);
        missingInEn.forEach(key => console.error(`  - ${key}`));
        hasError = true;
    }

    // Check empty strings
    function findEmpty(obj, prefix = '') {
        let empty = [];
        for (const key in obj) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            const val = obj[key];
            if (typeof val === 'string') {
                if (val.trim() === '') empty.push(fullKey);
            } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                empty = empty.concat(findEmpty(val, fullKey));
            }
        }
        return empty;
    }

    const emptyInEn = findEmpty(enData);
    const emptyInId = findEmpty(idData);

    if (emptyInEn.length > 0) {
        console.error(`\x1b[31mEmpty strings in ${path.relative(localesDir, enPath)}:\x1b[0m`);
        emptyInEn.forEach(key => console.error(`  - ${key}`));
        hasError = true; // Strict: fail on empty
    }
    if (emptyInId.length > 0) {
        console.error(`\x1b[31mEmpty strings in ${path.relative(localesDir, idPath)}:\x1b[0m`);
        emptyInId.forEach(key => console.error(`  - ${key}`));
        hasError = true; // Strict: fail on empty
    }

    return !hasError;
}

function checkTranslations() {
    console.log(`Scanning ${localesDir}...`);

    // Find all directories that contain en.json or id.json
    const files = getFiles(localesDir);
    const dirs = new Set(files.map(f => path.dirname(f)));

    let allPassed = true;

    dirs.forEach(dir => {
        // Skip root if we moved everything out?
        // Wait, root still contains 'en.old.json'? 
        // getFiles only picks en.json and id.json. 
        // If I renamed root en.json to en.old.json, it won't be picked.
        // Good.
        if (!checkFilePair(dir)) {
            allPassed = false;
        }
    });

    if (allPassed) {
        console.log('\x1b[32mAll translation checks passed!\x1b[0m');
    } else {
        console.error('\x1b[31mTranslation check failed!\x1b[0m');
        process.exit(1);
    }
}

checkTranslations();
