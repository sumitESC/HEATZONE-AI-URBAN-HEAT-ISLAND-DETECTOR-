async function runTest2() {
  const msg = {
    model: "qwen3:4b",
    messages: [{ role: "user", content: "hello" }],
    stream: false
  };
  const res = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(msg)
  });
  const data = await res.json();
  console.log(data.message?.content);
}
runTest2();
