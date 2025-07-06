# Search Feature Specification

## Overview

Implement an application-wide search that helps users quickly locate messages across channels and direct messages (DMs) they have permission to view. The experience should feel instantaneous and intuitive, comparable to modern web search engines.

---

## User Experience (UX)

1. **Entry Point**
   • A **Search** nav item has been added to the sidebar (`components/app-sidebar.tsx`).

2. **Search Modal**
   • Clicking **Search** opens a large center-screen modal built with **shadcn/ui** components.  
   • Modal should dismiss via **Esc** key or clicking outside.

3. **Search Input**
   • The primary focus of the modal is a single `Input` component centered near the top.  
   • **Autofocus** the input so users can start typing immediately.  
   • **Debounce** keystrokes (~300 ms) before initiating search requests to avoid spamming the backend.

4. **Results List**
   • Below the input, render results in a **table-like list** (`<Table>` or flex rows).  
   • Each row shows:  
    – **Title**: Channel or DM name.  
    – **Snippet**: Up to 100 characters of surrounding text with the matched term **highlighted** (wrap match in `<mark>`).

5. **Navigation**
   • Clicking a result navigates directly to that channel/DM **and** scrolls to the matched message (deep-link via message ID + hash).

6. **Loading & Empty States**
   • Display a skeleton/`Skeleton` rows while fetching.  
   • Show a friendly "No results" illustration/text when nothing matches.

---

## Accessibility

• Ensure modal traps focus and is announced as a dialog.  
• All interactive elements must be keyboard navigable.  
• Highlighting should maintain sufficient color contrast.

---

## Technical Requirements

1. **Debounced Query**  
   Use `useDebounce` (custom hook) or `lodash.debounce` inside a React client component.

2. **API Endpoint**  
   Expose `trpc.search.query` accepting `{ query: string }` and returning an array of matches.  
   Only return results where the current user **has access** (server-side auth check).

3. **Search Algorithm**  
   • Implement **full-text search** in the database (PostgreSQL `tsvector` or Prisma + PostgresFTS).  
   • Support fuzzy matching and ranking (`ts_rank`, trigram similarity).  
   • Consider additional boosting (recency, channel importance).

4. **Highlighting**  
   SQL can produce start-/end-offsets; alternatively slice the message content in TypeScript and wrap the match in `<mark>`.

5. **Pagination**  
   Return first _N_ (e.g., 20) results; provide "Load more" or infinite scroll for the rest.

---

## Shadcn Implementation Notes

• Modal: `Dialog` with `DialogContent` sized `max-w-5xl w-[90vw] h-[90vh]`.  
• Input: `Input` with `className="text-2xl"` for prominence.  
• Table: Either `Table` from shadcn or custom flex grid using `Separator` between rows.

---

## Next Steps

1. Create the `search` TRPC procedure with PostgreSQL full-text query.
2. Build `<SearchModal />` component with debounced input & results list.
3. Wire sidebar link to open modal (likely via global store or context).
4. Add deep-linking to a specific message inside channel view.
