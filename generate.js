const axios = require("axios");
const fs = require("fs");

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {

  const list = await axios.get(
    "https://raw.githubusercontent.com/Bimbayo1985/rare-pigeons-assets/main/list.json"
  );

  const assets = list.data.cards.map(c => c.asset);

  const addressMap = {};

  for (const asset of assets) {

    try {

      const res = await axios.get(
        `https://xchain.io/api/asset/${asset}`
      );

      if (!res.data || !res.data.holders_count) continue;

      const holders = await axios.get(
        `https://xchain.io/api/asset/${asset}/balances`
      );

      for (const h of holders.data.data || []) {

        if (parseFloat(h.quantity) > 0) {
          if (!addressMap[h.address]) {
            addressMap[h.address] = new Set();
          }
          addressMap[h.address].add(asset);
        }
      }

      await sleep(500);

    } catch (e) {
      console.log("Error:", asset);
    }
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
}

run();
