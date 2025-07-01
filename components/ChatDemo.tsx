"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpcClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"

export default function ChatDemo() {
  const utils = trpc.useUtils();
  const {
    data: messages = [],
    isLoading: loading,
  } = trpc.listMessages.useQuery();
  const [message, setMessage] = useState("");
  const postMutation = trpc.postMessage.useMutation({
    onSuccess: () => {
      // no-op; websocket will deliver the message
    },
  });

  const sendMessage = (message: string) => postMutation.mutate({ text: message });

  useEffect(() => {
    // initial data already fetched by react-query

    // establish WebSocket for realtime
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT || 3001;
    const host = window.location.hostname; // handles localhost / 127.0.0.1 / custom
    const ws = new WebSocket(`${protocol}://${host}:${wsPort}`);

    ws.onopen = () => console.log("🔌 WS connected");
    ws.onerror = (e) => console.error("WS error", e);

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        console.log("📨 WS message", msg);
        utils.listMessages.setData(undefined, (old = []) => [...old, msg]);
      } catch (err) {
        console.error("bad ws payload", err);
      }
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full min-h-[400px] flex-1 justify-end">
      <div className="flex flex-col flex-1 justify-end">
        <div className="flex-1 flex flex-col justify-end overflow-y-auto">
          <ul className="mt-2 list-inside text-sm">
            {loading && <div>Loading…</div>}
            {messages.map((m) => (
              <li key={m.id}>
                <span className="font-mono text-xs text-gray-500 w-32 inline-block">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </span>{" "}
                {m.sender?.email ?? "anon"}: {m.content}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2 mt-4 justify-end">
          <Input
            type="text"
            className="border px-2 py-1 rounded"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && message.trim() !== "") {
                sendMessage(message);
                setMessage("");
              }
            }}
          />
          <Button
            onClick={() => {
              if (message.trim() !== "") {
                sendMessage(message);
                setMessage("");
              }
            }}
            className="border px-2 py-1 rounded"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )};