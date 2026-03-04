const fs = require("fs")

const LIST_URL =
"https://raw.githubusercontent.com/Bimbayo1985/rare-pigeons-assets/main/list.json"

const API =
"https://tokenscan.io/api/holders/"

const EXCLUDED =
"1PigeonPPBbRQSmJ5NPFafnap7kCrXMwms"

function sleep(ms){
return new Promise(r=>setTimeout(r,ms))
}

async function fetchHolders(asset){

const url = `${API}${asset}?start=0&length=100`

for(let i=0;i<3;i++){

try{

const r = await fetch(url)
const j = await r.json()

if(j && j.data) return j.data

}catch(e){}

await sleep(500)

}

return null

}

async function run(){

console.log("Building leaderboard")

const list = await fetch(LIST_URL).then(r=>r.json())

let assets = []

if(Array.isArray(list)){
assets = list
}
else if(list.assets){
assets = list.assets
}
else if(list.cards){
assets = list.cards.map(x=>x.asset)
}

console.log("Assets:",assets.length)

let holders = {}

for(const asset of assets){

console.log("Processing:",asset)

const data = await fetchHolders(asset)

if(!data){

console.log("Failed:",asset)
continue

}

for(const row of data){

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

}

const result =
Object.values(holders)
.sort((a,b)=>b.uniqueCards-a.uniqueCards)

const output = {
totalCards: assets.length,
holders: result,
updatedAt: new Date().toISOString()
}

fs.writeFileSync(
"./leaderboard.json",
JSON.stringify(output,null,2)
)

console.log("Done")
console.log("Holders:",result.length)

}

run()
