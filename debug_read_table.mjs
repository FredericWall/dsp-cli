import { getCommands } from "@sap/datasphere-cli";

const HOST = process.env.DATASPHERE_HOST;
const cmds = await getCommands(HOST);
await cmds["login"]({
  "--host": HOST,
  "--client-id": process.env.CLIENT_ID,
  "--client-secret": process.env.CLIENT_SECRET,
  "--authorization-flow": "authorization_code",
  "--force": true,
});

// capture stdout
const orig = process.stdout.write.bind(process.stdout);
const chunks = [];
process.stdout.write = (c) => { chunks.push(typeof c === "string" ? c : c.toString()); return true; };
try {
  await cmds["objects local-tables read"]({
    "--host": HOST,
    "--space": process.env.SPACE,
    "--technical-name": "SAP_FIN_CS_IL_I_CNSLDTNSGMTHIERELIM",
  });
} finally {
  process.stdout.write = orig;
}
const raw = chunks.join("");
console.log("=== RAW LENGTH:", raw.length);
console.log("=== FIRST 300 CHARS:");
console.log(raw.slice(0, 300));
console.log("=== LAST 300 CHARS:");
console.log(raw.slice(-300));
console.log("=== INDEX OF '{':", raw.indexOf("{"));
