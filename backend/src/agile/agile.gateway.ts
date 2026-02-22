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
  namespace: '/agile',
})
export class AgileGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AgileGateway.name);

  handleConnection() {
    this.logger.log('Client connected');
  }

  handleDisconnect() {
    this.logger.log('Client disconnected');
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

  broadcastBoardUpdate(workspaceId: string, board: unknown) {
    this.server.to(this.roomName(workspaceId)).emit('board-update', board);
  }

  broadcastBacklogUpdate(workspaceId: string) {
    this.server.to(this.roomName(workspaceId)).emit('backlog-update');
  }

  broadcastBoardsListUpdate(workspaceId: string) {
    this.server.to(this.roomName(workspaceId)).emit('boards-list-update');
  }

  private roomName(workspaceId: string) {
    return `${WORKSPACE_ROOM_PREFIX}${workspaceId}`;
  }
}
