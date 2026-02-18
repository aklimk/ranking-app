import request from "supertest";
import { createApp } from "../app.js";

let app = createApp();

test("GET /health returns ok", async () => {
  await request(app).get("/api/health").expect(200).expect([{ ok: 1 }]);
});
