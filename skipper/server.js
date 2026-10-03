// Skipper entry point (this is the file PM2 runs). All routes and tools live in app.js.
const { createApp, checkSecret } = require("./app");

const SECRET = process.env.SKIPPER_SECRET;
const problem = checkSecret(SECRET);
if (problem) {
  console.error("Skipper refusing to start: " + problem + ". Generate one with: openssl rand -hex 32");
  process.exit(1);
}

const PORT = process.env.PORT || 3400;
const HOST = "127.0.0.1"; // Nginx proxies to us; never listen on the public interface.

const app = createApp({ secret: SECRET });
const listener = app.listen(PORT, HOST, () => {
  const addr = listener.address();
  console.log("Skipper running on " + addr.address + ":" + addr.port);
});
