import Web3EthAbi from 'web3-eth-abi'
import * as Realm from "realm-web"
import { fetchEthereum, fetchIPFSJson, validateERC1155Json, getKnownProperties } from './utils/utils'
import isIPFS from 'is-ipfs'

const AnyMoeNFT_URI = [
  {
    "indexed": false,
    "internalType": "string",
    "name": "_value",
    "type": "string"
  },
  {
    "indexed": true,
    "internalType": "uint256",
    "name": "_id",
    "type": "uint256"
  }
]
const AnyMoeNFTContractAddress = "0xC5f06C1e1D0F353344614B0FBe3a42ecB2CFda00"
const AnyMoeNFT_URITopic = Web3EthAbi.encodeEventSignature({
  "anonymous": false,
  "inputs": AnyMoeNFT_URI,
  "name": "URI",
  "type": "event"
})

const dbapp = new Realm.App({ id: MONGODB_REALM_APPID })
const credentials = Realm.Credentials.apiKey( MONGODB_REALM_APIKEY )

async function handleScheduled(event) {
  const dbuser = await dbapp.logIn(credentials)
  const mongodb = dbuser.mongoClient("mongodb-atlas")
  const Token = mongodb.db("AnyMoe").collection("Token")
  
  let NowBlockHeight = (await fetchEthereum({
    "method":"eth_blockNumber",
    "params":[]
  }))["result"]
  let LastBlockHeight = await STATE.get("LastBlockHeight")
  await STATE.put("LastBlockHeight", NowBlockHeight)
  
  let logs = (await fetchEthereum({
    "method":"eth_getLogs",
    "params":[{"fromBlock": LastBlockHeight, "toBlock": NowBlockHeight, "topics":[AnyMoeNFT_URITopic], "address": AnyMoeNFTContractAddress}]
  }))["result"]
  
 
  for(let log of logs) {
    if (log["data"] === "0x") continue;
    log["topics"].shift()
    let parsedLog = Web3EthAbi.decodeLog(AnyMoeNFT_URI, log["data"], log["topics"])
    console.log(parsedLog)
    
    let uri = parsedLog["_value"].split("://")

    if (uri.length != 2) continue;
    let scheme = uri[0]
    let path = uri[1]
    let metadata = null
    console.log(uri)
    
    switch (scheme){
      case "ipfs":
        path = "/ipfs/" + path
        if (isIPFS.path(path)) {
          metadata = await fetchIPFSJson(path)
        }
      break
      case "ipns":
        path = "/ipns/" + path
        if (isIPFS.path(path)) {
          metadata = await fetchIPFSJson(path)
        }
      
    }

    if (metadata === null) continue;
    if(!validateERC1155Json(metadata)) continue;

    let tokenData = getKnownProperties(metadata, ["name", "description"])
    
    
    await Token.updateOne(
      {
        "_id": parsedLog["_id"]
      },
      {
        $set: tokenData
      },
      { upsert: true }
    )
  
  }
}

addEventListener("scheduled", event => {
  event.waitUntil(handleScheduled(event))
})