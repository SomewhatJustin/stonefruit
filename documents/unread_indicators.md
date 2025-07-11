# Unread Indicators – MVP Draft

> Show which channels/DMs contain messages I have **not seen yet** and clear the badge once opened.

---

## 1. UX Requirements

| #   | Requirement                      | Notes                                                                                                   |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | **Dot / badge** on sidebar items | Solid `bg-primary` 6-px circle to the **right** of channel/DM name (same as Slack)                      |
| 2   | **Counts optional**              | For v1 we **do not** show numeric counts—just a dot means “there is _something_ new”.                   |
| 3   | **Clear on open**                | Navigating to the conversation immediately removes the dot.                                             |
| 4   | **Real-time updates**            | If another user sends a message in an open sidebar while I’m elsewhere the dot appears without refresh. |
| 5   | **Accessibility**                | `aria-label="unread"` on the dot; high-contrast colour in dark/light modes.                             |

### Visual mock-up

```tsx
<SidebarItem title="#general">
  {/* ...channel icon / name... */}
  {isUnread && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
</SidebarItem>
```

---

## 2. Data Model (`schema.prisma`)

```prisma
model ChannelRead {
  channelId String
  userId    String
  lastRead  DateTime @default(now())

  @@id([channelId, userId])
}
```

Notes:

1. **Composite PK** → one row per user/channel, compact.
2. **DMs** reuse the same table because DMs are `Channel { isDirect = true }`.
3. No counter columns — counts are derived on the fly (see §3).

_No migration of historical data needed; rows are lazily created on first “mark-as-read”._

---

## 3. Server Logic

1. **Procedure:** `trpc.read.mark`
   - **input** `{ channelId: string }`
   - `upsert` `ChannelRead` where `userId == session.user.id` setting `lastRead = new Date()`
2. **Procedure:** `trpc.read.list`
   - Returns an array of `channelId` the user has **unread** messages in.
   - Query:

   ```ts
   SELECT c.id
   FROM Channel c
   LEFT JOIN ChannelRead r ON r.channelId = c.id AND r.userId = $currentUser
   LEFT JOIN Message m ON m.channelId = c.id
   WHERE m.createdAt > COALESCE(r.lastRead, '1970-01-01')
     AND m.senderId <> $currentUser
   GROUP BY c.id;
   ```

   Prisma equivalent uses `prisma.$queryRaw` or two simpler queries.

3. **WebSocket broadcast**: everytime a message is created, broadcast `{ channelId }` so other users can diff against their local `unreadSet`.

---

## 4. Client Integration

1. **`useChat` hook**
   - add `markRead(channelId)` calling `trpc.read.mark` and removing id from `unreadSet` in cache.
2. **Sidebar components** (`nav-conversations.tsx`, `nav-messages.tsx`)
   - fetch `trpc.read.list` on mount and store in Zustand/React Query.
   - Render the dot if `unreadSet.has(channelId)`.
3. **Route change listener**
   - On `router.push(/channels/[id])` or `/dm/[uid]` fire `markRead` once messages finish loading.

---

## 5. Real-Time Updates

```
server → ws.broadcast("newMessage", { channelId })
client socket.on("newMessage", ({ channelId }) => {
  if (router.current !== channelId) unreadSet.add(channelId)
})
```

This piggy-backs on the existing message event—no new event types.

---

## 6. Edge Cases & Performance

1. **Long-inactive users** – indexing on `createdAt` keeps the join fast; consider archiving messages >90 days from unread calc.
2. **Bulk imports** – moderators importing history should skip websocket emit to avoid false dots.
3. **Deleted channels** – `ON DELETE CASCADE` cleans `ChannelRead` rows.
4. **Read receipts per message** are **out-of-scope** for v1.

---

## 7. Implementation Checklist

- [ ] Prisma `ChannelRead` model + migrate
- [ ] `trpc.read.mark` & `trpc.read.list` procedures
- [ ] Update websocket server to emit `{ channelId }` on `message:new`
- [ ] Extend `useChat` with `markRead` helper
- [ ] Fetch unread set on sidebar mount & render dot
- [ ] Route change → mark as read
