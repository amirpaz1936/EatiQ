import { useState } from "react";

export function App() {
  const [count, setCount] = useState(0);

  return (
    <main className="app">
      <h1>EatiQ</h1>
      <p>Vite + React + TypeScript inside a Turborepo workspace.</p>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        count is {count}
      </button>
    </main>
  );
}
