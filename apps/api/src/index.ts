import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import extractRoute from "./routes/extract.route";

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(requestLogger);

// ─── Routes ─────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    provider: env.AI_PROVIDER,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/csv", extractRoute);

// ─── Error Handler (must be last) ──────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────
const port = env.API_PORT;
app.listen(port, () => {
  console.log(`\n🚀 GrowEasy API running at http://localhost:${port}`);
  console.log(`   AI Provider: ${env.AI_PROVIDER}`);
  console.log(`   Batch Size: ${env.AI_BATCH_SIZE}`);
  console.log(`   Max Rows: ${env.MAX_ROWS}`);
  console.log(`   Environment: ${env.NODE_ENV}\n`);
});

export default app;
