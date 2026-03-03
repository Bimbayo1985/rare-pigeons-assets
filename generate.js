const axios = require("axios");
const fs = require("fs");

const RPC_URL = "https://xchain.io/api/";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getBalances(asset) {
  try {
    const response = await axios.post(RPC_URL, {
      method: "get_balances",
      params: {
        filters: [
          { field: "asset", op: "==", value: asset }
        ],
        filterop: "and"
      },
      jsonrpc: "2.0",
      id: 0
    }, {
      headers: { "Content-Type": "application/json" }
    });

    return response.data.result || [];

  } catch (e) {
    console.log("RPC error:", asset);
    return [];
  }
}

async function run() {

  console.log("Starting leaderboard build...");

  const list = await axios.get(
    "https://raw.githubusercontent.com/Bimbayo1985/rare-pigeons-assets/main/list.json"
  );

  const assets = list.data.cards.map(c => c.asset);
  const addressMap = {};

  for (const asset of assets) {

    console.log("Processing:", asset);

    const balances = await getBalances(asset);

    for (const entry of balances) {

      if (parseFloat(entry.quantity) > 0) {

        if (!addressMap[entry.address]) {
          addressMap[entry.address] = new Set();
        }

        addressMap[entry.address].add(asset);
      }
    }

    await sleep(500); // щоб не злити RPC
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

  fs.writeFileSync("leaderboard.json", JSON.stringify(result, null, 2));

  console.log("Leaderboard generated.");
}

run();
