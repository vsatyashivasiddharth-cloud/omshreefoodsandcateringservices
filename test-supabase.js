require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connected!");

    const result = await client.query("SELECT version()");
    console.log(result.rows[0]);

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

main();