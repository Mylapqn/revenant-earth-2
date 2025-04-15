import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';
import path, { dirname } from 'path';

import { fileURLToPath } from 'url';

// @ts-ignore
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;

const wss = new WebSocketServer({ port: PORT });

const ENTITY_FILE_PATH = path.join(__dirname, 'currentEntity.json');

if (!fs.existsSync(ENTITY_FILE_PATH)) {
  fs.writeFileSync(ENTITY_FILE_PATH, JSON.stringify({}), 'utf8');
}

wss.on('connection', (ws) => {
  console.log('New client connected');

  const currentEntityData = fs.readFileSync(ENTITY_FILE_PATH, 'utf8');
  ws.send(currentEntityData);

  ws.on('message', (message) => {
    console.log('Received entity data from client');
    
    fs.writeFileSync(ENTITY_FILE_PATH, message as unknown as string, 'utf8');
    console.log('Saved entity data to currentEntity.json');
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

fs.watch(ENTITY_FILE_PATH, (eventType, filename) => {
  if (eventType === 'change') {
    console.log('currentEntity.json changed');

    const updatedEntityData = fs.readFileSync(ENTITY_FILE_PATH, 'utf8');

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(updatedEntityData);
      }
    });
  }
});