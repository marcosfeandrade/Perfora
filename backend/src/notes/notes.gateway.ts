import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

const WORKSPACE_ROOM_PREFIX = 'workspace-';

@WebSocketGateway({
  cors: { origin: true },
  namespace: '/notes',
})
export class NotesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotesGateway.name);

  handleConnection() {
    this.logger.log('Notes client connected');
  }

  handleDisconnect() {
    this.logger.log('Notes client disconnected');
  }

  @SubscribeMessage('join-workspace')
  handleJoinWorkspace(
    client: { join: (room: string) => void },
    payload: { workspaceId: string },
  ) {
    if (payload?.workspaceId) {
      client.join(this.roomName(payload.workspaceId));
    }
  }

  @SubscribeMessage('leave-workspace')
  handleLeaveWorkspace(
    client: { leave: (room: string) => void },
    payload: { workspaceId: string },
  ) {
    if (payload?.workspaceId) {
      client.leave(this.roomName(payload.workspaceId));
    }
  }

  broadcastNoteUpdate(workspaceId: string, note: unknown) {
    this.server.to(this.roomName(workspaceId)).emit('note-update', note);
  }

  broadcastNotesStructureUpdate(workspaceId: string) {
    this.server
      .to(this.roomName(workspaceId))
      .emit('notes-structure-update', { workspaceId });
  }

  private roomName(workspaceId: string) {
    return `${WORKSPACE_ROOM_PREFIX}${workspaceId}`;
  }
}
