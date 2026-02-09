
import * as dotenv from 'dotenv';
dotenv.config();

console.log('Starting checks...');

try {
    const shared = require('@gym-monorepo/shared');
    console.log('Shared loaded keys:', Object.keys(shared));
    console.log('GroupSessionStatus:', shared.GroupSessionStatus);
} catch (e) {
    console.error('Failed to load shared', e);
}

try {
    console.log('Importing GroupSessionEntity...');
    const { GroupSessionEntity } = require('./src/database/entities/group-session.entity');
    console.log('GroupSessionEntity loaded.');
} catch (e) {
    console.error('Failed GroupSessionEntity', e);
}
