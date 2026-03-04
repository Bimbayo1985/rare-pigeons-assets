const fs = require("fs")

const MUSEUM = "1PigeonPPBbRQSmJ5NPFafnap7kCrXMwms"

const LIMIT = 100

async function fetchHolders(asset){

    let start = 0
    let all = []

    while(true){

        const url = `https://cp20.tokenscan.io/explorer/holders/${asset}?start=${start}&length=${LIMIT}&action=first`

        console.log("fetch:", url)

        const res = await fetch(url)

        const json = await res.json()

        if(!json.data || json.data.length === 0) break

        const chunk = json.data.map(h => ({
            address: h.address,
            quantity: Number(h.quantity)
        }))

        all = all.concat(chunk)

        if(chunk.length < LIMIT) break

        start += LIMIT
    }

    return all
}

async function main(){

    console.log("Generating leaderboard")

    const list = JSON.parse(
        fs.readFileSync("list.json","utf8")
    )

    const assets = list.cards.map(c => c.asset)

    const holdersMap = {}

    for(const asset of assets){

        console.log("processing:", asset)

        try{

            const holders = await fetchHolders(asset)

            for(const h of holders){

                const address = h.address

                if(!address) continue
                if(address === MUSEUM) continue

                if(!holdersMap[address]){
                    holdersMap[address] = new Set()
                }

                if(h.quantity > 0){
                    holdersMap[address].add(asset)
                }
            }

            await new Promise(r=>setTimeout(r,300))

        }catch(e){

            console.log("error:", asset)
            console.log(e)

        }
    }

    const holders = Object.entries(holdersMap)
        .map(([address,set])=>({
            address,
            uniqueCards:set.size
        }))
        .sort((a,b)=>b.uniqueCards-a.uniqueCards)

    const output = {
        totalCards: assets.length,
        holders,
        updatedAt: new Date().toISOString()
    }

    fs.writeFileSync(
        "leaderboard.json",
        JSON.stringify(output,null,2)
    )

    console.log("Leaderboard generated")
}

main()
