import { Module } from '@nestjs/common';
import { AgileController } from './agile.controller.js';
import { AgileService } from './agile.service.js';
import { AgileGateway } from './agile.gateway.js';
import { WorkspaceModule } from '../workspace/workspace.module.js';

@Module({
  imports: [WorkspaceModule],
  controllers: [AgileController],
  providers: [AgileService, AgileGateway],
  exports: [AgileService],
})
export class AgileModule {}
