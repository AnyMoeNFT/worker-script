async function fetchEthereum(data) {
    data["jsonrpc"] = "2.0"
    data["id"] = 1
    let res = await fetch(new Request("https://polygon-mumbai.g.alchemy.com/v2/" + ALCHEMY_TOKEN, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
            "Content-Type": "application/json"
        }
    }))
    return await res.json()
}

async function fetchIPFSJson(cidPath) {
    let res = await fetch("https://cloudflare-ipfs.com" + cidPath).catch(function(error) {
        return {}
    })
    return await res.json()
}

export {
    fetchEthereum,
    fetchIPFSJson
}