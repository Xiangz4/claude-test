import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'fx_user',
  password: process.env.DATABASE_PASSWORD || 'fx_password',
  database: process.env.DATABASE_NAME || 'channel_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: false, // Always use migrations in production
  logging: process.env.NODE_ENV === 'development',
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
};

// For TypeORM CLI
export const dataSource = new DataSource(typeOrmConfig as DataSourceOptions);
