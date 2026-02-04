import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import Joi from 'joi';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { PopupOperationPolicyDay } from './popup/entities/popup-operation-policy-day.entity';
import { PopupOperationPolicy } from './popup/entities/popup-operation-policy.entity';
import { Popup } from './popup/entities/popup.entity';
import { PopupModule } from './popup/popup.module';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HASH_ROUNDS: Joi.number().required(),
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'parkchanryong',
      password: 'chn80114841',
      database: 'PICKIT',
      synchronize: true,
      entities: [Popup, PopupOperationPolicy, PopupOperationPolicyDay, User],
    }),
    PopupModule,
    UserModule,
    AuthModule,
  ],
})
export class AppModule {}
