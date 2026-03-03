const axios = require("axios");
const fs = require("fs");

async function run() {

  const listUrl = "https://raw.githubusercontent.com/Bimbayo1985/rare-pigeons-assets/main/list.json";
  const listRes = await axios.get(listUrl);

  const assets = Array.isArray(listRes.data)
    ? listRes.data.map(x => x.asset)
    : listRes.data.cards.map(x => x.asset);

  const addressMap = {};

  for (const asset of assets) {

    try {
      const res = await axios.get(`https://xchain.io/api/asset/${asset}`);
const holders = res.data.holders || [];

      holders.forEach(h => {
        if (parseFloat(h.quantity) > 0) {
          if (!addressMap[h.address]) {
            addressMap[h.address] = new Set();
          }
          addressMap[h.address].add(asset);
        }
      });

    } catch (e) {
      console.log("Error:", asset);
    }
  }

  const results = Object.entries(addressMap).map(([address, set]) => ({
    address,
    uniqueCards: set.size
  }));

  results.sort((a, b) => b.uniqueCards - a.uniqueCards);

  const payload = {
    totalCards: assets.length,
    holders: results.slice(0, 100)
  };

  fs.writeFileSync("leaderboard.json", JSON.stringify(payload, null, 2));

  console.log("Leaderboard generated.");
}

run();
