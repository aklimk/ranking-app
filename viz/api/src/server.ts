import { createApp } from "./app.js";

import { forceEnvVar } from "./tools.js";
const port = parseInt(forceEnvVar(process.env["PORT"]));
const app = createApp();
app.listen(port, () => console.log(`API listening on :${port}`));
