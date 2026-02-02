import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Popup } from './popup/entities/popup.entity';
import { PopupModule } from './popup/popup.module';
import { PopupOperationPolicy } from './popup/entities/popup-operation-policy.entity';
import { PopupOperationPolicyDay } from './popup/entities/popup-operation-policy-day.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'parkchanryong',
      password: 'chn80114841',
      database: 'PICKIT',
      synchronize: true,
      entities: [Popup, PopupOperationPolicy, PopupOperationPolicyDay],
    }),
    PopupModule,
  ],
})
export class AppModule {}
