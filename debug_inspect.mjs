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
try { await cmds["config cache init"]({ "--host": HOST }); } catch {}
const fresh = await getCommands(HOST);

const orig = process.stdout.write.bind(process.stdout);
const chunks = [];
process.stdout.write = (c) => { chunks.push(typeof c === "string" ? c : c.toString()); return true; };
try {
  await fresh["objects local-tables read"]({
    "--host": HOST,
    "--space": process.env.SPACE,
    "--technical-name": "SAP_FIN_CS_IL_I_CNSLDTNSGMTHIERELIM",
  });
} finally {
  process.stdout.write = orig;
}
const raw = chunks.join("");
const i = raw.indexOf("{");
const data = JSON.parse(raw.slice(i));

// Inspect top-level keys and the definition annotations
console.log("Top-level keys:", Object.keys(data));
const defKey = Object.keys(data.definitions)[0];
console.log("Def key:", defKey);
const def = data.definitions[defKey];
console.log("Def annotations (top-level @ keys):", Object.keys(def).filter(k => k.startsWith("@")));
console.log("Has 'kind':", def.kind);
console.log("Has 'technical-type'-related:", Object.keys(def).filter(k => k.toLowerCase().includes("technical")));
console.log("Full definition keys:", Object.keys(def));
