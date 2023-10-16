const WebSocket = require("ws");
const { PrismaClient } = require("./generated/client/index.js");

const prisma = new PrismaClient();
const server = new WebSocket.Server({ port: 3000 });

async function getTableInfo(tableName) {
  const model = prisma[tableName];
  if (!model) {
    throw new Error(`Model for table '${tableName}' not found.`);
  }
  const fields = await eval(`prisma.${tableName}.fields`);
  return {
    tableName,
    fields,
  };
}
const availableTables = Object.keys(prisma)
  .filter((model) => !model.startsWith("$") && !model.startsWith("_"))
  .sort();

server.on("connection", async (socket) => {
  console.log("Client connected");
  socket.send(JSON.stringify({ availableTables }));
  const tableList = await Promise.all(
    availableTables.map((tableName) => getTableInfo(tableName))
  );
  socket.send(JSON.stringify({ tableList }));

  socket.on("message", async (message) => {
    try {
      const command = JSON.parse(message);

      if (command.query) {
        console.log(command.query);
        const result = await executePrismaQuery(command.query);
        if (result.error) {
          socket.send(
            JSON.stringify({ error: result.error, details: result.details })
          );
        } else {
          socket.send(JSON.stringify({ result }));
        }
      } else {
        socket.send(JSON.stringify({ error: "Invalid command" }));
      }
    } catch (error) {
      socket.send(JSON.stringify({ error: "Invalid JSON format" }));
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
  });
});

async function executePrismaQuery(query) {
  try {
    const result = await eval(`prisma.${query}`);
    return result;
  } catch (error) {
    return { error: "Error executing Prisma query", details: error.message };
  }
}
