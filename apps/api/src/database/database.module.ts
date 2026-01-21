import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ALL_ENTITIES } from './entities';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow<string>('DB_HOST'),
        port: configService.getOrThrow<number>('DB_PORT'),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        ssl: configService.get<string>('DB_SSL') === 'true',
        extra: {
          options: '-c timezone=UTC',
        },
        entities: ALL_ENTITIES,
        autoLoadEntities: true,
        synchronize: false, // checking explicitly as per requirements
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
