//src/database/postgres/postgres.module.ts
import { Global, Module } from '@nestjs/common';
import { postgresProvider, POSTGRES_POOL } from './postgres.provider';

@Global()
@Module({
  providers: [postgresProvider],
  exports: [POSTGRES_POOL],
})
export class PostgresModule {}