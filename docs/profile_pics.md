# Automatic Profile Pictures for Stonefruit

> Goal: When a new account is created, automatically generate a unique avatar composed of a **stonefruit SVG** over a coloured/gradient background, save it on the server (self-host friendly), and store its URL in `User.image`.

---

## 1. Asset Library

1. **Fruit emojis** (5)
   - �� Peach, 🍒 Cherries, 🥭 Mango, 🥥 Coconut, 🫒 Olive
   - Use **Twemoji** SVG assets (public domain) sized ≤5 KB each
   - Location: `public/avatars/fruits/<unicode>.svg`
2. **Backgrounds** (25 solid colours)
   - Maintain a constant array of **25 hex codes** in the script
   - Render colours directly with `sharp` (no files needed)

Total combinations: **125** (5 × 25) — plenty for MVP.

---

## 2. Storage Layout

```
public/
└─ avatars/
   ├─ fruits/          # 5 base SVGs
   └─ generated/       # one PNG per userId → <userId>.png
```

_Why keep generated images in `public/`?_ They are served by Next.js' static handler and require **zero** extra infra (aligns with self-hosting ethos).

---

## 3. Generation Script (`scripts/generateAvatar.ts`)

| Step | Details                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | **Dependencies**: `sharp` (raster/compose), `random-seed` (deterministic RNG using userId)       |
| 2    | **Input**: `userId: string`                                                                      |
| 3    | Pick _n = userId.hashCode % 25_ → `hex = BACKGROUNDS[n]`                                         |
| 4    | Pick _m = userId.hashCode / 25 % 5_ fruit → `<fruit-m>.svg`                                      |
| 5    | `sharp({ create: { width: 256, height: 256, channels: 4, background: hex } })` → composite fruit |
| 6    | Output `public/avatars/generated/<userId>.png` (or overwrite if re-run)                          |
| 7    | Return relative URL `/avatars/generated/<userId>.png`                                            |

Deterministic mapping ensures idempotency (same userId → same avatar) without DB look-ups.

---

## 4. DB / Schema Changes

No changes needed — Prisma `User` already has optional `image: String?` field (used by NextAuth). We will populate this with the generated URL.

---

## 5. Hooking into Account Creation

1. **NextAuth `events.createUser`**
   ```ts
   events: {
     async createUser({ user }) {
       const url = await generateAvatar(user.id)
       await prisma.user.update({ where: { id: user.id }, data: { image: url } })
     }
   }
   ```
2. Alternatively, add a **Prisma `middleware`** on `create` for `User` if we ever bypass NextAuth.

Either way, avatar generation happens **once** on first signup and is fully server-side.

---

## 6. Fallback & Regeneration

- If generation fails, default to `/avatars/default.png`.
- Admin/CLI script (`pnpm avatar:regen`) can loop through all users and (re)generate avatars—useful after adding new fruit/background assets.

---

## 7. Future Ideas

- Allow users to upload a custom photo (replace generated PNG).
- Expand fruit set, add seasonal themes.
- Generate SVG-only avatars for infinite combinations (e.g., background shapes, recoloured paths) — avoids PNG raster.

---

### Implementation Checklist

- [ ] Add 5 optimised fruit SVGs
- [ ] Define 25 background hex codes in script
- [ ] Implement `scripts/generateAvatar.ts` (Sharp composite)
- [ ] Wire into NextAuth `events.createUser`
- [ ] Create CLI util `pnpm avatar:regen`
- [ ] Update README with new env/dependencies

> **Ship small loops**: start by committing assets + script, run on a test signup, then integrate CLI/regeneration.
