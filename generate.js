const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function getHolders(asset) {
  try {
    const url = `https://tokenscan.io/asset/${asset}?tab=holders`;

    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(data);
    const holders = [];

    $("table tbody tr").each((i, row) => {
      const cols = $(row).find("td");

      const quantity = $(cols[2]).text().trim();
      const address = $(cols[4]).text().trim();

      if (address && quantity) {
        holders.push({
          address,
          quantity: parseFloat(quantity)
        });
      }
    });

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
      if (holder.quantity > 0) {
        if (!addressMap[holder.address]) {
          addressMap[holder.address] = new Set();
        }
        addressMap[holder.address].add(asset);
      }
    }

    await new Promise(r => setTimeout(r, 500));
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
