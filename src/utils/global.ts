import { Server } from 'socket.io';

const global: {
  server: Server['sockets'];
} = {
  server: null,
};

export default global;
