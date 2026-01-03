const { AppDataSource } = require('./typeorm-datasource.ts');

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized');
    
    await AppDataSource.runMigrations();
    console.log('Migrations completed');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
