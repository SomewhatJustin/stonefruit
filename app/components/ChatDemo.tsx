"use client";

import { useEffect, useState } from "react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender?: { email?: string | null };
}

export default function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/trpc/listMessages?input=%7B%7D", // listMessages expects encoded {}
      );
      const json = await res.json();
      setMessages(json?.result?.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendHello = async () => {
    try {
      await fetch("/api/trpc/postMessage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hello from ui" }),
      });
      // optimistically refresh list
      fetchMessages();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();

    // establish WebSocket for realtime
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT || 3001;
    const host = window.location.hostname; // handles localhost / 127.0.0.1 / custom
    const ws = new WebSocket(`${protocol}://${host}:${wsPort}`);

    ws.onopen = () => console.log("🔌 WS connected");
    ws.onerror = (e) => console.error("WS error", e);

    ws.onmessage = (e) => {
      try {
        const msg: Message = JSON.parse(e.data);
        setMessages((prev) => [...prev, msg]);
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
        <button
          onClick={fetchMessages}
          className="border px-2 py-1 rounded"
        >
          Refresh
        </button>
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