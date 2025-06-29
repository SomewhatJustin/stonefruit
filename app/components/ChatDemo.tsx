"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpcClient";

export default function ChatDemo() {
  const utils = trpc.useUtils();
  const {
    data: messages = [],
    isLoading: loading,
  } = trpc.listMessages.useQuery();

  const postMutation = trpc.postMessage.useMutation({
    onSuccess: () => {
      // no-op; websocket will deliver the message
    },
  });

  const sendHello = () => postMutation.mutate({ text: "hello from ui" });

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
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button onClick={sendHello} className="border px-2 py-1 rounded">
          Send hello
        </button>
      </div>
      {loading && <div>Loading…</div>}
      <ul className="mt-2 list-disc list-inside text-sm">
        {messages.map((m) => (
          <li key={m.id}>
            <span className="font-mono text-xs text-gray-500">
              {new Date(m.createdAt).toLocaleTimeString()}
            </span>{" "}
            {m.sender?.email ?? "anon"}: {m.content}
          </li>
        ))}
      </ul>
    </div>
  );
} 