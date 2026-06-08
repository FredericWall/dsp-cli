import { getCommands } from "@sap/datasphere-cli";

const HOST = process.env.DATASPHERE_HOST;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function main() {
  const commands = await getCommands(HOST);
  await commands["login"]({
    "--host": HOST,
    "--client-id": CLIENT_ID,
    "--client-secret": CLIENT_SECRET,
    "--authorization-flow": "authorization_code",
    "--force": true,
  });
  const commands2 = await getCommands(HOST);
  const all = Object.keys(commands2);
  console.log("local/table commands:", all.filter(k => k.toLowerCase().includes("local") || k.toLowerCase().includes("table")));
  console.log("update commands:", all.filter(k => k.includes("update")));
}
main().catch(e => console.error(e.message));
