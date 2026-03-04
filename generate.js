const fs = require("fs")

const LIST_URL =
"https://raw.githubusercontent.com/Bimbayo1985/rare-pigeons-assets/main/list.json"

const API =
"https://tokenscan.io/api/asset/holders/"

const EXCLUDED =
"1PigeonPPBbRQSmJ5NPFafnap7kCrXMwms"

async function run(){

console.log("Building leaderboard")

const list = await fetch(LIST_URL).then(r=>r.json())

const assets = list

let holders = {}

for(const asset of assets){

console.log("Asset:",asset)

const url = API + asset

const r = await fetch(url)

const j = await r.json()

for(const h of j.data){

if(h.address === EXCLUDED) continue

if(!holders[h.address]){

holders[h.address] = {
address: h.address,
uniqueCards:0
}

}

if(h.quantity > 0){

holders[h.address].uniqueCards++

}

}

}

let result = Object.values(holders)

result.sort((a,b)=>b.uniqueCards-a.uniqueCards)

const json = {
totalCards: assets.length,
holders: result
}

fs.writeFileSync(
"./leaderboard.json",
JSON.stringify(json,null,2)
)

console.log("Done")

}

run()
