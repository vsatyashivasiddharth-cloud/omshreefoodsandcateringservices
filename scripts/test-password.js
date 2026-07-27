const bcrypt = require("bcrypt");

async function main() {
  const hash =
    "$2b$10$s1dkp5Mdnmhc1f98T6.k8OAD3iTDfTAsBpBfLpBLVj3hN7KvIIpUi" // paste the password hash from check-admin.js

  console.log(
    await bcrypt.compare("Saichotu123", hash)
  );
}

main();