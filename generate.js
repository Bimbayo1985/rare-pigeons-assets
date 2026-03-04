const fs = require("fs")
const axios = require("axios")

const LIST_URL =
"https://raw.githubusercontent.com/Bimbayo1985/rare-pigeons-assets/main/list.json"

const EXCLUDED =
"1PigeonPPBbRQSmJ5NPFafnap7kCrXMwms"

const MAX_RETRIES = 10

async function sleep(ms){
  return new Promise(r => setTimeout(r, ms))
}

async function getHolders(asset){

  const url =
  `https://tokenscan.io/explorer/holders/${asset}?start=0&length=100&action=first`

  for(let attempt=1; attempt<=MAX_RETRIES; attempt++){

    try{

      const r = await axios.get(url,{
        headers:{ "accept":"application/json" },
        timeout:10000
      })

      const j = r.data

      if(!j.data) return []

      return j.data.map(row => ({
        address: row[4],
        quantity: Number(row[2])
      }))

    }catch(e){

      console.log(`Retry ${attempt}/${MAX_RETRIES}:`,asset)

      await sleep(1500)

    }

  }

  console.log("FAILED AFTER RETRIES:",asset)

  return []
}

async function run(){

  console.log("Starting leaderboard build...")

  const list =
    await axios.get(LIST_URL).then(r=>r.data)

  const assets =
    list.cards.map(c => c.asset)

  const holders = {}

  for(const asset of assets){

    console.log("Processing:",asset)

    const data = await getHolders(asset)

    for(const row of data){

      if(!row.address) continue
      if(row.quantity <= 0) continue

      if(row.address === EXCLUDED)
        continue

      if(!holders[row.address])
        holders[row.address] = new Set()

      holders[row.address].add(asset)

    }

    // pause між assets щоб не блокував tokenscan
    await sleep(300)

  }

  const leaderboard = Object.entries(holders)
    .map(([address,set])=>({
      address,
      uniqueCards:set.size
    }))
    .sort((a,b)=>b.uniqueCards-a.uniqueCards)

  const out = {
    totalCards: assets.length,
    holders: leaderboard,
    updatedAt: new Date().toISOString()
  }

  fs.writeFileSync(
    "leaderboard.json",
    JSON.stringify(out,null,2)
  )

  console.log("Done")
  console.log("Holders:",leaderboard.length)

}

run()
