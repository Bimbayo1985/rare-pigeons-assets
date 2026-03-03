const axios = require("axios");
const fs = require("fs");

async function getHolders(asset) {
  try {
    const url = `https://api.counterparty.io/v2/assets/${asset}/holders`;

    const response = await axios.get(url);

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

  const assets = list.cards.map(c => c.asset);
  const addressMap = {};

  for (const asset of assets) {

    console.log("Processing", asset);

    const holders = await getHolders(asset);

    for (const holder of holders) {

      if (parseFloat(holder.quantity) > 0) {

        if (!addressMap[holder.address]) {
          addressMap[holder.address] = new Set();
        }

        addressMap[holder.address].add(asset);
      }
    }

    await new Promise(r => setTimeout(r, 300));
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
