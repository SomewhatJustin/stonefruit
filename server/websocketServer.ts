import { WebSocketServer, type WebSocket } from "ws"
import { messageEvents } from "@/trpc"

const PORT = Number(process.env.WS_PORT ?? 3001)

export function startWebSocketServer() {
  const wss = new WebSocketServer({ port: PORT })
  console.log(`✅ WebSocket server listening on ws://localhost:${PORT}`)

  wss.on("connection", (socket: WebSocket) => {
    const send = (msg: unknown) => {
      try {
        socket.send(JSON.stringify(msg))
      } catch (err) {
        /* silent */
      }
    }

    // push historical? maybe not.
    messageEvents.on("new", send)
    messageEvents.on("typing", send)

    socket.on("close", () => {
      messageEvents.off("new", send)
      messageEvents.off("typing", send)
    })
    socket.on("error", () => {
      messageEvents.off("new", send)
      messageEvents.off("typing", send)
    })
  })
}

// Auto-start when this module is imported in Node runtime
if (typeof window === "undefined") {
  startWebSocketServer()
}
