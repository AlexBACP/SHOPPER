import { Module } from '@nestjs/common';
import { MongodbModule } from './mongodb/mongodb.module';
import { PostgresModule } from './postgres/postgres.module';

@Module({
  imports: [MongodbModule, PostgresModule],
})
export class DatabaseModule { }

