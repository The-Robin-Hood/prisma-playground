import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

interface ws_rmsg {
  table: keyof PrismaClient;
  query: keyof PrismaClient[keyof PrismaClient];
  condition: string | null;
}
interface ws_smsg {
  status: boolean,
  result?: Record<string, any>,
  error?: Record<string, any>,
}

const availableTables = Object.keys(prisma)
  .filter((model) => !model.startsWith("$") && !model.startsWith("_"))
  .sort();

const availableFields: Record<string, string[]> = {};

availableTables.forEach((tableName) => {
  const fields = (prisma[tableName as keyof PrismaClient] as any).fields;
  availableFields[tableName] = Object.keys(fields);
});


async function executePrismaQuery(msg: ws_rmsg): Promise<ws_smsg> {
  try {
    const condition = msg.condition ? JSON.parse(msg.condition) : undefined;
    const result = await (prisma[msg.table][msg.query] as any)(condition);
    return {
      status: true,
      result: result
    }
  } catch (error: any) {
    return {
      error: error.message,
      status: false,
    }
  }
}

const isValidJson = (ctx: string) => {
  try {
    const test = JSON.parse(ctx);
    if (test.table && test.query && test.condition != undefined) return true;
    return true;
  } catch (e) {
    return false;
  }
}

const basePath = "./dist";

Bun.serve({
  fetch(req, server) {
    const url = new URL(req.url);
    let filePath = basePath + url.pathname;
    if (url.pathname === "/") {
      filePath = basePath + "/index.html";
    }
    if (url.pathname === "/server") {
      server.upgrade(req, {});
      return;
    }
    if (url.pathname.startsWith("/")) {
      try {
        const file = Bun.file(filePath);
        return new Response(file);
      } catch (e) {
        return new Response("404!");
      }
    }
    return new Response("404!");
  },
  websocket: {
    async message(ws:WebSocket, message: string) {
      if (typeof message !== 'string') {
        ws.send(JSON.stringify({
          error: 'Invalid message type',
          result: null
        }))
        return;
      }
      if (!isValidJson(message)) {
        ws.send(JSON.stringify({
          error: 'Invalid json',
          status: false,
        }))
        return;
      };
      const result = await executePrismaQuery(JSON.parse(message));
      ws.send(JSON.stringify(result));
    },
    async open(ws: WebSocket) {
      const initialMessage = {
        status: true,
        availableTables,
        availableFields,
      };
      ws.send(JSON.stringify(initialMessage));
    },
  },
});

console.log("Server started at http://localhost:3000");