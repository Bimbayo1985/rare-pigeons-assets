const axios = require("axios");
const fs = require("fs");

const RPC_URL = "https://counterpartychain.io/api/";

async function getBalances(asset) {
  try {
    const response = await axios.post(
      RPC_URL,
      {
        method: "get_balances",
        params: {
          filters: [
            { field: "asset", op: "==", value: asset }
          ],
          filterop: "and",
          limit: 1000
        },
        jsonrpc: "2.0",
        id: 0
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    if (response.data.error) {
      console.log("RPC error for", asset);
      return [];
    }

    return response.data.result || [];

  } catch (e) {
    console.log("Failed for", asset);
    return [];
  }
}

async function run() {

  console.log("Building leaderboard...");

  const list = JSON.parse(
    fs.readFileSync("list.json", "utf8")
  );

  if (!list.cards) {
    console.log("list.json format invalid");
    return;
  }

  const assets = list.cards.map(c => c.asset);
  const addressMap = {};

  for (const asset of assets) {

    console.log("Processing", asset);

    const balances = await getBalances(asset);

    for (const entry of balances) {

      if (parseFloat(entry.quantity) > 0) {

        if (!addressMap[entry.address]) {
          addressMap[entry.address] = new Set();
        }

        addressMap[entry.address].add(asset);
      }
    }

    // невелика пауза щоб не спамити RPC
    await new Promise(r => setTimeout(r, 400));
  }

  const leaderboard = Object.entries(addressMap)
    .map(([address, set]) => ({
      address,
      uniqueCards: set.size
    }))
    .sort((a, b) => b.uniqueCards - a.uniqueCards)
    .slice(0, 100);

  const result = {
    totalCards: assets.length,
    holders: leaderboard,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    "leaderboard.json",
    JSON.stringify(result, null, 2)
  );

  console.log("Leaderboard saved.");
}

run();
