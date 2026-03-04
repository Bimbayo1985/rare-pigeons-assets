const fs = require("fs")

const MUSEUM = "1PigeonPPBbRQSmJ5NPFafnap7kCrXMwms"

async function getHolders(asset){

    let start = 0
    const limit = 100
    let all = []

    while(true){

        const url =
        `https://tokenscan.io/explorer/holders/${asset}?start=${start}&length=${limit}`

        const r = await fetch(url,{
            headers:{ "accept":"application/json" }
        })

        const j = await r.json()

        if(!j.data) break

        const chunk = j.data.map(h => ({
            address:h.address,
            quantity:Number(h.quantity)
        }))

        all = all.concat(chunk)

        if(chunk.length < limit) break

        start += limit
    }

    return all
}

async function run(){

    console.log("Building leaderboard")

    const list = JSON.parse(
        fs.readFileSync("list.json","utf8")
    )

    const assets = list.cards.map(c => c.asset)

    const holders = {}

    for(const asset of assets){

        console.log("Processing:",asset)

        try{

            const h = await getHolders(asset)

            for(const row of h){

                if(row.address === MUSEUM) continue

                if(!holders[row.address])
                    holders[row.address] = new Set()

                if(row.quantity > 0)
                    holders[row.address].add(asset)

            }

        }catch(e){

            console.log("Failed:",asset)

        }

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
