const fs = require("fs")

const LIST_URL =
"https://raw.githubusercontent.com/Bimbayo1985/rare-pigeons-assets/main/list.json"

const HOLDERS_URL =
"https://tokenscan.io/explorer/holders/"

const EXCLUDED =
"1PigeonPPBbRQSmJ5NPFafnap7kCrXMwms"

async function run(){

console.log("Building leaderboard")

const r = await fetch(LIST_URL)
const list = await r.json()

let assets = []

// підтримка всіх можливих структур list.json
if(Array.isArray(list)){

assets = list

}
else if(list.assets){

assets = list.assets

}
else if(list.cards){

assets = list.cards.map(c => c.asset)

}
else{

console.log("Cannot detect assets list")
process.exit(1)

}

console.log("Assets:", assets.length)

let holders = {}

for(const asset of assets){

console.log("Processing:", asset)

try{

const url =
`${HOLDERS_URL}${asset}?start=0&length=100&action=first`

const res = await fetch(url)
const data = await res.json()

if(!data.data) continue

for(const row of data.data){

const address = row.address
const qty = Number(row.quantity)

if(!address) continue
if(address === EXCLUDED) continue
if(qty <= 0) continue

if(!holders[address]){

holders[address] = {
address: address,
uniqueCards: 0
}

}

holders[address].uniqueCards++

}

}catch(e){

console.log("Failed:", asset)

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
}, null, 2)
)

console.log("Done")
console.log("Holders:", result.length)

}

run()
