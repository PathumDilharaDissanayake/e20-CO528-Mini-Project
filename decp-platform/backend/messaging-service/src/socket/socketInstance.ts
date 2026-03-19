import { Server as SocketIOServer } from 'socket.io';

let _io: SocketIOServer | null = null;

export const setSocketIO = (io: SocketIOServer): void => {
  _io = io;
};

export const getSocketIO = (): SocketIOServer | null => _io;
