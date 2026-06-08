import { getCommands } from "@sap/datasphere-cli";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const HOST = process.env.DATASPHERE_HOST;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const SPACE = process.env.SPACE;
const TABLE = "SAP_FIN_CS_IL_I_CNSLDTNPRFTCTRHIERELIM";

function captureStdout(fn) {
  const orig = process.stdout.write.bind(process.stdout);
  const chunks = [];
  process.stdout.write = (chunk, ...rest) => {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString());
    return true;
  };
  return fn().finally(() => { process.stdout.write = orig; }).then(() => chunks.join(""));
}

function parseJson(raw) {
  const i = raw.indexOf("{");
  if (i < 0) throw new Error("No JSON in output: " + raw.slice(0, 300));
  return JSON.parse(raw.slice(i));
}

async function authenticate() {
  const commands = await getCommands(HOST);
  await commands["login"]({
    "--host": HOST,
    "--client-id": CLIENT_ID,
    "--client-secret": CLIENT_SECRET,
    "--authorization-flow": "authorization_code",
    "--force": true,
  });
  try { await commands["config cache init"]({ "--host": HOST }); } catch { /* non-blocking */ }
  return getCommands(HOST);
}

const commands = await authenticate();

// 1. Read current definition
console.log("Reading table definition...");
let csn;
try {
  const raw = await captureStdout(() =>
    commands["objects local-tables read"]({
      "--host": HOST,
      "--space": SPACE,
      "--technical-name": TABLE,
    })
  );
  csn = parseJson(raw);
} catch (err) {
  console.error("Read failed:", err.response?.data ?? err.message);
  process.exit(1);
}

const def = csn.definitions[TABLE];

// Check column doesn't already exist
if (def.elements["TESTCOLUMN_DSP"]) {
  console.log("Column TESTCOLUMN_DSP already exists — nothing to do.");
  process.exit(0);
}

// 2. Add new column to elements
def.elements["TESTCOLUMN_DSP"] = {
  "@EndUserText.label": "Test Column DSP",
  "type": "cds.String",
  "length": 100,
};

// 3. For delta tables, do NOT modify query.SELECT (it's managed by DSP)
// Remove query from the payload to avoid "invalid technical-type" error
delete def.query;

// 4. Write to temp file and update
const tmpFile = join(tmpdir(), `${TABLE}_update.json`);
writeFileSync(tmpFile, JSON.stringify(csn, null, 2));

console.log("Updating table with new column...");
try {
  await commands["objects local-tables update"]({
    "--host": HOST,
    "--space": SPACE,
    "--technical-name": TABLE,
    "--file-path": tmpFile,
    "--no-deploy": true,
  });
  console.log("Done — TESTCOLUMN_DSP added successfully.");
} catch (err) {
  console.error("Update failed:", err.response?.data ?? err.message);
} finally {
  try { unlinkSync(tmpFile); } catch { /* ignore */ }
}
