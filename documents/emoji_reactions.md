# Emoji Reactions – MVP Draft

> Add Slack-style emoji reactions to messages with **zero extra infra** and real-time updates.

---

## 1. UX Changes

| #   | Requirement                           | Notes                                                                                               |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | **Hover highlight** on every message  | Subtle bg color so users know which message they are targeting                                      |
| 2   | **Actions icon** appears on hover     | `lucide:smile-plus` (or similar) absolutely positioned on the **right** of the message bubble       |
| 3   | **Emoji picker** on click             | Prefer [`emoji-mart`](https://github.com/missive/emoji-mart) – tiny, tree-shakable, dark-mode aware |
| 4   | **Inline reaction bar** below content | Shows grouped emoji + count; auto-wrap as needed                                                    |
| 5   | **Toggle on click**                   | Clicking an emoji you already reacted with → _unreact_, else _react_                                |
| 6   | **Hover tooltip**                     | List of user.displayName (or `@username`) who reacted                                               |

### Component Sketch

```tsx
<Message>
  <div className="hover:bg-muted/40 group relative">
    {/* Content */}
    <SmilePlusIcon className="opacity-0 group-hover:opacity-100 absolute right-2 top-2" />
    <ReactionBar reactions={message.reactions} />
  </div>
</Message>
```

---

## 2. Data Model (`schema.prisma`)

```prisma
model Reaction {
  messageId String
  userId    String
  emoji     String  // unicode, e.g. "👍"
  createdAt DateTime @default(now())

  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([messageId, userId, emoji])       // each user → 1 reaction per emoji per message
  @@index([messageId, emoji])            // fast aggregation
}
```

_No foreign keys/extra tables needed._ A **composite primary key** prevents duplicate reactions by the same user. For **future custom PNG emojis**, store `emoji` as `custom:<id>` referencing a `CustomEmoji` table containing the image URL.

---

## 3. Server API

1. **trpc.reaction.toggle**
   - **input**: `{ messageId: string; emoji: string }`
   - **logic**:
     1. `const existing = await prisma.reaction.findUnique(...)`
     2. `existing ? delete : create`
   - **return**: aggregated counts for the message
2. **WebSocket broadcast** (already have `server/websocketServer.ts`)
   - Publish updated reaction payload `{ messageId, reactions }`
   - Clients listening in the channel patch cache optimistically

---

## 4. Client Integration

1. **`useChat` hook**
   - Add `toggleReaction(messageId, emoji)` which calls TRPC + optimistic cache update
2. **`ReactionBar` component**
   - Group by emoji ➜ `{ emoji, count, reactedByMe: boolean }`
   - Button style: `bg-secondary/70 hover:bg-secondary text-sm rounded-full px-2`  
     `reactedByMe` ➜ `bg-primary text-primary-foreground`
3. **Picker**
   - Lazy-load the picker (`dynamic(() => import("emoji-mart"))`)
   - Close on outside click / Escape

---

## 5. Real-Time Updates

Existing websocket pub/sub (channels, DMs) can reuse the **message update** event:

```ts
// server
ws.broadcast("reaction", { channelId, messageId, reactions })
// client
socket.on("reaction", patchCache)
```

No DB polling required.

---

## 6. Edge Cases & Performance

1. **Large reaction spam** – aggregate counts server-side `SELECT emoji, COUNT(*)` to keep payload small.
2. **Emoji aliases** – store the raw unicode only (no `:thumbsup:` alias) to avoid duplicate variants.
3. **Skin tones** – the picker returns the **full unicode sequence** so every tone is unique.
4. **Deleted messages** – cascade delete reactions via FK `onDelete: Cascade`.

---

## 7. Implementation Checklist

- [x] Add hover CSS to `MessageList` items
- [x] Install `emoji-mart`
- [x] Prisma `Reaction` model + migrate
- [x] `trpc.reaction.toggle` backend procedure
- [x] WebSocket broadcast on mutation
- [x] Update `useChat` hook with `toggleReaction`
- [x] `ReactionBar` component + tooltip
- [ ] SmilePlus action icon on messages
- [ ] Integrate `emoji-mart` picker
