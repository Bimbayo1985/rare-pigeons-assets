const axios = require("axios");
const fs = require("fs");

const PAGE_SIZE = 100;
const MUSEUM = "1PigeonPPBbRQSmJ5NPFafnap7kCrXMwms";

function sleep(ms){
  return new Promise(r => setTimeout(r, ms));
}

async function getHolders(asset){

  let start = 0;
  let holders = [];

  while(true){

    const url =
      `https://tokenscan.io/explorer/holders/${asset}?start=${start}&length=${PAGE_SIZE}&action=first`;

    try{

      const { data } = await axios.get(url,{
        headers:{
          "User-Agent":"Mozilla/5.0",
          "Accept":"application/json"
        },
        timeout:10000
      });

      const rows = data.data || [];

      if(rows.length === 0) break;

      holders.push(...rows);

      if(rows.length < PAGE_SIZE) break;

      start += PAGE_SIZE;

      await sleep(200);

    }catch(e){

      console.log("API error", asset, start, e.message);
      break;

    }
  }

  return holders;
}

async function run(){

  console.log("Building leaderboard");

  const list =
    JSON.parse(fs.readFileSync("list.json","utf8"));

  const assets =
    list.cards.map(c => c.asset);

  const addressMap = {};

  for(const asset of assets){

    console.log("Processing", asset);

    const holders =
      await getHolders(asset);

    for(const row of holders){

      const quantity =
        parseFloat(row[2]);

      const address =
        row[4];

      if(!address) continue;
      if(address === MUSEUM) continue;
      if(quantity <= 0) continue;

      if(!addressMap[address]){
        addressMap[address] = new Set();
      }

      addressMap[address].add(asset);
    }

    await sleep(200);
  }

  const leaderboard =
    Object.entries(addressMap)
      .map(([address,set])=>({
        address,
        uniqueCards:set.size
      }))
      .sort((a,b)=>b.uniqueCards-a.uniqueCards);

  const result = {
    totalCards: assets.length,
    holders: leaderboard,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(
    "leaderboard.json",
    JSON.stringify(result,null,2)
  );

  console.log("Leaderboard saved");
}

run();
