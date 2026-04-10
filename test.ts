async function runTest1() {
  const start = Date.now();
  console.log("Fetching from Ollama...");
  const msg = {
    model: "qwen3:4b",
    messages: [{ role: "user", content: "Tell me a short joke." }],
    stream: false
  };
  try {
    const res = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(msg)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Duration:", Date.now() - start, "ms");
    console.log("Content:", data.message?.content.substring(0, 100));
  } catch (e) {
    console.error("Error:", e);
  }
}
runTest1();
