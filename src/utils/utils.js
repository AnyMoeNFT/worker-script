import { Validator } from '@cfworker/json-schema'
import ERC1155JsonSchema from '../extra/ERC1155-Metadata-Json-Schema.json'

const ERC1155JsonValidator = new Validator(ERC1155JsonSchema)

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
    try {
        let res = await fetch("https://cloudflare-ipfs.com" + cidPath)
        return await res.json()
    } catch (e) {
        return null
    }
}

function validateERC1155Json(meta) {
    return ERC1155JsonValidator.validate(meta)["valid"]
}

function getKnownProperties(from, properties) {
    let res = {}
    for (let pr of properties) {
        if (from.hasOwnProperty(pr)) res[pr] = from[pr]
    }
    return res
}

export {
    fetchEthereum,
    fetchIPFSJson,
    validateERC1155Json,
    getKnownProperties
}