import { Module } from '@nestjs/common';
import { ReportsController } from './controller/reports.controller';
import { ReportsService } from './service/reports.service';
import { ReportsRepository } from './reports.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reports } from './reports.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reports])],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsRepository],
  exports: [ReportsService, ReportsRepository],
})
export class ReportsModule {}
