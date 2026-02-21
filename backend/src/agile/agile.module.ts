import { Module } from '@nestjs/common';
import { AgileController } from './agile.controller.js';
import { AgileService } from './agile.service.js';
import { AgileGateway } from './agile.gateway.js';

@Module({
  controllers: [AgileController],
  providers: [AgileService, AgileGateway],
  exports: [AgileService],
})
export class AgileModule {}
