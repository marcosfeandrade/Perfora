import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller.js';
import { NotesService } from './notes.service.js';
import { NotesGateway } from './notes.gateway.js';

@Module({
  controllers: [NotesController],
  providers: [NotesService, NotesGateway],
  exports: [NotesService],
})
export class NotesModule {}
