// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PostgresModule } from './database/postgres/postgres.module';
import { MongodbModule } from './database/mongodb/mongodb.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PostgresModule,
    MongodbModule,
    RedisModule,
    UsersModule,
    AuthModule,
    StoresModule,
    ProductsModule,
    CartModule,
  ],
})
export class AppModule {}