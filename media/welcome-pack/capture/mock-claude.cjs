// A stand-in for the Anthropic API, for capturing the welcome-pack films
// from a local copy of Toran. A poster gets the events on the sample
// patrika (public/demo-posters/patrika.jpg); a pasted message gets the
// Gita Jayanti path from the example WhatsApp message.
const http = require("http");
const poster = [
  { title: "Maha Shivaratri", title_gu: "મહા શિવરાત્રી", date: "2027-03-06", time: "20:00", summary: "Rudrabhishek and bhajans through the night.", summary_gu: "રુદ્રાભિષેક અને આખી રાત ભજન", kind: "festival" },
  { title: "Ram Navami", title_gu: "રામ નવમી", date: "2027-04-15", time: "12:00", summary: "Janmotsav at noon, with aarti and prasad.", summary_gu: "જન્મોત્સવ, આરતી અને પ્રસાદ", kind: "festival" },
  { title: "Hanuman Jayanti", title_gu: "હનુમાન જયંતી", date: "2027-04-20", time: "19:00", summary: "Sunderkand path.", summary_gu: "સુંદરકાંડ પાઠ", kind: "festival" },
];
const message = [
  { title: "Gita Jayanti path", title_gu: "", date: "2026-12-20", time: "10:00", summary: "The whole Bhagavad Gita read together in the main hall. All welcome, prasad after.", summary_gu: "", kind: "katha" },
];
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const events = body.includes("in this message") ? message : poster;
    setTimeout(() => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ id: "msg_mock", type: "message", role: "assistant", model: "mock", stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 }, content: [{ type: "text", text: JSON.stringify({ events }) }] }));
    }, 3500);
  });
}).listen(4010);
