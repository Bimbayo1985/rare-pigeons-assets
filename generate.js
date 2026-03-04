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

let assets = []

// підтримка будь-якої структури list.json
if(Array.isArray(list)){
assets = list
}
else if(Array.isArray(list.assets)){
assets = list.assets
}
else if(Array.isArray(list.cards)){
assets = list.cards.map(x=>x.asset)
}
else{
console.log("Unknown list format")
process.exit(1)
}

console.log("Assets:",assets.length)

let holders = {}

for(const asset of assets){

console.log("Asset:",asset)

try{

const r = await fetch(API + asset)
const j = await r.json()

// якщо tokenscan не повернув data
if(!j || !Array.isArray(j.data)){
console.log("No holders for",asset)
continue
}

for(const h of j.data){

if(!h.address) continue

if(h.address === EXCLUDED) continue

if(!holders[h.address]){
holders[h.address] = {
address: h.address,
uniqueCards: 0
}
}

if(h.quantity > 0){
holders[h.address].uniqueCards++
}

}

}catch(e){

console.log("Failed asset:",asset)

}

}

let result = Object.values(holders)

result.sort((a,b)=>b.uniqueCards-a.uniqueCards)

const json = {
totalCards: assets.length,
holders: result,
updatedAt: new Date().toISOString()
}

fs.writeFileSync(
"./leaderboard.json",
JSON.stringify(json,null,2)
)

console.log("Leaderboard done")
console.log("Holders:",result.length)

}

run()
