const axios = require("axios");
const fs = require("fs");

async function getHolders(asset) {
  try {
    const url = `https://tokenscan.io/asset/${asset}?start=0&length=100&action=first`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    // data.data — це масив рядків таблиці
    const rows = data.data || [];
    const holders = [];

    for (const row of rows) {
      const quantity = parseFloat(row[2]); // колонка Quantity
      const address = row[4];              // колонка Address

      if (address && quantity > 0) {
        holders.push({ address, quantity });
      }
    }

    return holders;

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
      if (!addressMap[holder.address]) {
        addressMap[holder.address] = new Set();
      }
      addressMap[holder.address].add(asset);
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
