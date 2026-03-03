const axios = require("axios");
const fs = require("fs");

async function getHolders(asset) {
  try {
    const url = `https://tokenscan.io/explorer/holders/${asset}?start=0&length=100&action=first`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    // data is expected as an object with data rows
    return data.data || [];

  } catch (e) {
    console.log("Failed for", asset, "->", e.message);
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

    for (const row of holders) {
      // row is an array like [ #, percentage, qty, ..., address, ... ]
      const address = row[4];
      const quantity = parseFloat(row[2]);

      if (address && quantity > 0) {
        if (!addressMap[address]) {
          addressMap[address] = new Set();
        }
        addressMap[address].add(asset);
      }
    }

    // small pause so we don't get blocked
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
