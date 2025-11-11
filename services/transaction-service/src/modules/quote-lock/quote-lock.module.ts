import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuoteLockController } from './quote-lock.controller';
import { QuoteLockService } from './quote-lock.service';
import { QuoteLock } from '../../entities';

@Module({
  imports: [TypeOrmModule.forFeature([QuoteLock])],
  controllers: [QuoteLockController],
  providers: [QuoteLockService],
  exports: [QuoteLockService],
})
export class QuoteLockModule {}
