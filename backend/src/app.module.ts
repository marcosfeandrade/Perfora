import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './core/prisma/prisma.module.js';
import { WorkspaceModule } from './workspace/workspace.module.js';
import { AgileModule } from './agile/agile.module.js';
import { AuthModule } from './auth/auth.module.js';
import { NotesModule } from './notes/notes.module.js';

@Module({
  imports: [PrismaModule, AuthModule, WorkspaceModule, AgileModule, NotesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
