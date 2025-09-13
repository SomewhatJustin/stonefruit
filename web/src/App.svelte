<script>
  import "./app.css";
  import svelteLogo from "./assets/svelte.svg";
  import viteLogo from "/vite.svg";
  import MessageComposer from "./lib/MessageComposer.svelte";
</script>

<main class="flex-column m-8">
  <h1 class="text-lg">Hey</h1>
  <MessageComposer />
</main>

<style>
  .title {
    font-size: 2rem;
  }
</style>
