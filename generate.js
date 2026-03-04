const fs = require("fs")

async function getHolders(asset){

    const url =
    `https://tokenscan.io/explorer/holders/${asset}?start=0&length=100`

    const r = await fetch(url,{
        headers:{
            "accept":"application/json"
        }
    })

    const j = await r.json()

    if(!j.data) return []

    return j.data.map(h => ({
        address:h.address,
        quantity:Number(h.quantity)
    }))
}

async function run(){

    console.log("Building leaderboard")

    const assets = JSON.parse(
        fs.readFileSync("list.json","utf8")
    )

    const holders = {}

    for(const asset of assets){

        console.log("Processing:",asset)

        try{

            const h = await getHolders(asset)

            for(const row of h){

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
