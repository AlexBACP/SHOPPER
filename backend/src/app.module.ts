// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PostgresModule }  from './database/postgres/postgres.module';
import { MongodbModule }   from './database/mongodb/mongodb.module';
import { RedisModule }     from './redis/redis.module';
import { EmailModule }     from './email/email.module';
import { AuthModule }      from './auth/auth.module';
import { UsersModule }     from './users/users.module';
import { StoresModule }    from './stores/stores.module';
import { ProductsModule }  from './products/products.module';
import { CartModule }      from './cart/cart.module';
import { OrdersModule }    from './orders/orders.module';
import { UploadModule }    from './upload/upload.module';
import { ChatModule }          from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatsModule }    from './stats/stats.module';
import { WompiModule }   from './wompi/wompi.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SearchModule }   from './search/search.module';
import { ReviewsModule }  from './reviews/reviews.module';
import { CouponsModule }  from './coupons/coupons.module';
import { AiModule }       from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      // Límite general por IP (todas las rutas). El de "hora" es un colchón amplio
      // que no molesta al uso normal pero se endurece por ruta en los endpoints de IA.
      { name: 'global', ttl: 60_000,    limit: 60   },
      { name: 'hour',   ttl: 3_600_000, limit: 5000 },
    ]),
    PostgresModule,
    MongodbModule,
    RedisModule,
    EmailModule,
    UsersModule,
    AuthModule,
    StoresModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    UploadModule,
    ChatModule,
    NotificationsModule,
    StatsModule,
    WompiModule,
    WebhooksModule,
    SearchModule,
    ReviewsModule,
    CouponsModule,
    AiModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
