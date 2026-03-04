const fs = require("fs")

const LIST =
"https://raw.githubusercontent.com/Bimbayo1985/rare-pigeons-assets/main/list.json"

const HOLDERS =
"https://tokenscan.io/explorer/holders/"

const EXCLUDED =
"1PigeonPPBbRQSmJ5NPFafnap7kCrXMwms"

async function run(){

console.log("Building leaderboard")

const list = await fetch(LIST).then(r=>r.json())

const assets = Array.isArray(list) ? list : list.assets

console.log("Assets:",assets.length)

let holders = {}

for(const asset of assets){

console.log("Processing:",asset)

const url =
`${HOLDERS}${asset}?start=0&length=100&action=first`

try{

const r = await fetch(url)

const j = await r.json()

if(!j.data) continue

for(const row of j.data){

const address = row.address
const qty = Number(row.quantity)

if(address === EXCLUDED) continue

if(!holders[address]){

holders[address] = {
address: address,
uniqueCards: 0
}

}

if(qty > 0){

holders[address].uniqueCards++

}

}

}catch(e){

console.log("Failed:",asset)

}

}

const result =
Object.values(holders)
.sort((a,b)=>b.uniqueCards-a.uniqueCards)

fs.writeFileSync(
"./leaderboard.json",
JSON.stringify({
totalCards: assets.length,
holders: result,
updatedAt: new Date().toISOString()
},null,2)
)

console.log("Done")
console.log("Holders:",result.length)

}

run()
