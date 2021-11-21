import Web3EthAbi from 'web3-eth-abi'
import * as Realm from "realm-web"
import { fetchEthereum, fetchIPFSJson } from './utils/utils'
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
  //let LastBlockHeight = await STATE.get("LastBlockHeight")
  await STATE.put("LastBlockHeight", NowBlockHeight)
  let LastBlockHeight = "earliest"
  
  let logs = (await fetchEthereum({
    "method":"eth_getLogs",
    "params":[{"fromBlock": LastBlockHeight, "toBlock": NowBlockHeight, "topics":[AnyMoeNFT_URITopic], "address": AnyMoeNFTContractAddress}]
  }))["result"]
  for(let log of logs) {
    if (log["data"] == "0x") continue;
    log["topics"].shift()
    let parsedLog = Web3EthAbi.decodeLog(AnyMoeNFT_URI, log["data"], log["topics"])
    console.log(parsedLog)
    /*
    if (isIPFS.path(parsedLog["uri"])) {
      let metadata = await fetchIPFSJson(parsedLog["uri"])
      await Creator.updateOne(
        {
          "_id": parsedLog["address"]
        },
        {
          $set: { 
            "name": metadata["name"],
            "bio": metadata["bio"]
          }
        },
        { upsert: true }
      )
    }
    */
  }
}

addEventListener("scheduled", event => {
  event.waitUntil(handleScheduled(event))
})