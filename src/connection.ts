import https from 'https';
import fs from 'fs';
import WebSocket, { Server as WebSocketServer } from 'ws';
import { BOOTSTRAP_NODES, GENESIS_BLOCK_ID } from './constants.json';
import { BlockMessage, InvBlockMessage } from './types';
import { handleBlock, processData, getLatestBlock, getRankings } from './graph';

export const initialize = (port: number, tlsCert: string, tlsKey: string) => {
  const server = https.createServer({
    cert: fs.readFileSync(tlsCert),
    key: fs.readFileSync(tlsKey),
  });

  startWebSocketServer(server);
  startWebSocketClient(BOOTSTRAP_NODES[0]);

  server.listen(port);
};

let wsserver: WebSocketServer;

const startWebSocketServer = (server: https.Server) => {
  wsserver = new WebSocketServer({ server });
  console.log('ws server open');
  wsserver.on('connection', (ws, req) => {
    console.log(`client connected`);

    ws.on('close', () => {
      console.log(`client closed`);
    });

    ws.on('error', () => {
      console.log(`client errored`);
    });

    const response = getRankings();

    const jsonResponse = JSON.stringify({
      type: 'rank_result',
      body: response,
    });

    console.log('sending data to client');
    ws.send(jsonResponse);
  });
};

const startWebSocketClient = async (nodeAddress: string) => {
  const nodeConnection = new WebSocket(
    `wss://${nodeAddress}/${GENESIS_BLOCK_ID}`,
    {
      protocol: 'cruzbit.1',
      rejectUnauthorized: false,
    },
  );

  console.log(`connecting to node ${nodeAddress}`);

  nodeConnection.on('close', () => {
    console.log(`node ${nodeConnection.url} closed`);
  });

  nodeConnection.on('error', () => {
    console.log(`node ${nodeConnection.url} closed`);
  });

  // socket is established
  nodeConnection.on('open', () => {
    console.log(`connected to node ${nodeAddress}`);

    // assign message handler
    messageHandler(nodeConnection);
  });
};

let isSyncing = false;

const messageHandler = (node: WebSocket) => {
  interface MessageHandlers {
    [key: string]: (body: any, node: WebSocket) => void | undefined | null;
  }

  const messageHandlers: MessageHandlers = {
    ['inv_block']: (body: InvBlockMessage, node: WebSocket) => {
      isSyncing = true;

      const block_ids = body.block_ids;
      block_ids.forEach((block_id: string) => {
        fetchBlockById(block_id, node);
      });

      const last_block_id = block_ids[block_ids.length - 1];

      if (last_block_id !== block_ids[0]) {
        findCommonAncestor(last_block_id, node);
        console.log('SYNC continuation');

        return; //Break out of this handler
      }

      isSyncing = false;
    },
    ['block']: (body: BlockMessage, node: WebSocket) => {
      handleBlock(body.block_id, body.block);

      if (!isSyncing) {
        console.log('SYNC complete');
        processData();
        broadcastRankings();
      }
    },
    ['find_common_ancestor']: (body: any, node: WebSocket) => {
      //conditionally toggle GENESIS_BLOCK_ID or LATEST_BLOCK_ID
      const latestBlockId = getLatestBlock();
      findCommonAncestor(latestBlockId ?? GENESIS_BLOCK_ID, node);
    },
    ['get_peer_addresses']: (body: any, node: WebSocket) => {
      const jsonMessage = JSON.stringify({
        type: 'peer_addresses',
        body: {
          addresses: [],
        },
      });
      node.send(jsonMessage);
    },
  };

  node.on('message', (data: string) => {
    const parsed = JSON.parse(data);
    const { type, body } = parsed;

    console.log('message received type: ', parsed);

    const handler = messageHandlers[type];
    handler?.(body, node);
  });
};

const fetchBlockById = (block_id: string, node: WebSocket) => {
  //TODO: skip if exists in cache
  const jsonMessage = JSON.stringify({
    type: 'get_block',
    body: { block_id },
  });
  node.send(jsonMessage);
};

const findCommonAncestor = (block_id: string, node: WebSocket) => {
  const jsonMessage = JSON.stringify({
    type: 'find_common_ancestor',
    body: {
      block_ids: [block_id],
    },
  });
  node.send(jsonMessage);
};

const broadcastRankings = () => {
  const response = getRankings();

  const jsonResponse = JSON.stringify({
    type: 'rank_result',
    body: response,
  });

  console.log(
    'sending data to connected clients; count:',
    wsserver.clients.size,
  );

  wsserver.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(jsonResponse, { binary: false });
    }
  });
};
