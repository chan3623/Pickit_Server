import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Popup } from './popup/entities/popup.entity';
import { PopupModule } from './popup/popup.module';

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
      entities: [Popup],
    }),
    PopupModule,
  ],
})
export class AppModule {}
