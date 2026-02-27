import { expect, test } from "bun:test";

test("echo works", async () => {
  const ws = new WebSocket("ws://localhost:8080/ws?user=tester&room=test");
  const messages: string[] = [];

  const done = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), 2000);

    ws.addEventListener("message", (ev) => {
      messages.push(String(ev.data));
      // After we receive the "welcome", send an echo
      if (messages.length === 1) {
        ws.send(JSON.stringify({ type: "echo", payload: "ok" }));
      } else {
        clearTimeout(timer);
        ws.close();
        resolve();
      }
    });

    ws.addEventListener("open", () => {
      // no-op; server will send welcome automatically
    });

    ws.addEventListener("error", (e) => reject(e as any));
  });

  await done;

  const echo = messages.find((m) => m.includes('"type":"echo"'));
  expect(echo).toBeDefined();
  expect(echo).toContain('"ok"');
});
