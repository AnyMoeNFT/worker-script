import Web3EthAbi from 'web3-eth-abi'
import {
  fetchEthereum,
  fetchIPFSJson,
  validateERC1155Json,
  getKnownProperties,
} from './utils/utils'
import AnyMoeAuctionABI from './extra/AnyMoeAuctionABI.json'

const AnyMoeAuctionCancleAuctionABI = AnyMoeAuctionABI[1]
const AnyMoeAuctionCancleAuctionTopic = Web3EthAbi.encodeEventSignature(
  AnyMoeAuctionCancleAuctionABI,
)

const AnyMoeAuctionCreateAuctionABI = AnyMoeAuctionABI[2]
const AnyMoeAuctionCreateAuctionTopic = Web3EthAbi.encodeEventSignature(
  AnyMoeAuctionCreateAuctionABI,
)

async function fetchNewAuctionInfo(mongodb, lbh, nbh) {
  const Auction = mongodb
    .mongoClient('mongodb-atlas')
    .db('AnyMoe')
    .collection('Auction')
  let logs = (
    await fetchEthereum({
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: lbh,
          toBlock: nbh,
          topics: [AnyMoeAuctionCreateAuctionTopic],
          address: ANYMOENFT_CONTRACT_ADDRESS,
        },
      ],
    })
  )['result']
  for (let log of logs) {
    if (log['data'] === '0x') continue
    log['topics'].shift()
    let CreateAuctionLog = Web3EthAbi.decodeLog(
      AnyMoeAuctionCreateAuctionABI['inputs'],
      log['data'],
      log['topics'],
    )

    await Auction.insertOne(
        {
            "_id": CreateAuctionLog["auctionId"],
            "owner": CreateAuctionLog["owner"],
            "tokenId": CreateAuctionLog["tokenId"],
            "amount": CreateAuctionLog["amount"],
            "baseBid": CreateAuctionLog["baseBid"],
            "bidIncrement": CreateAuctionLog["bidIncrement"],
            "duration": CreateAuctionLog["duration"],
            "isEnded": false,
            "bids": []
        }
    )
  }
}

async function fetchCancleAuction(mongodb, lbh, nbh) {
  const Auction = mongodb
    .mongoClient('mongodb-atlas')
    .db('AnyMoe')
    .collection('Auction')
  let logs = (
    await fetchEthereum({
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: lbh,
          toBlock: nbh,
          topics: [AnyMoeAuctionCancleAuctionTopic],
          address: ANYMOENFT_CONTRACT_ADDRESS,
        },
      ],
    })
  )['result']
  for (let log of logs) {
    if (log['data'] === '0x') continue
    log['topics'].shift()
    let CancleAuctionLog = Web3EthAbi.decodeLog(
      AnyMoeAuctionCancleAuctionABI['inputs'],
      log['data'],
      log['topics'],
    )

    await Auction.deleteOne({
      "_id": CancleAuctionLog["auctionId"]
    })
  }
}

export {
  fetchNewAuctionInfo,
  fetchCancleAuction
}