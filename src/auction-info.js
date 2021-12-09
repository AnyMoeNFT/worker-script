import Web3EthAbi from 'web3-eth-abi'
import {
  fetchEthereum,
  fetchIPFSJson,
  validateERC1155Json,
  getKnownProperties,
} from './utils/utils'
import AnyMoeAuctionCreateAuctionABI from './extra/AnyMoeAuction-CreateAuction-ABI.json'

const AnyMoeAuctionCreateAuctionTopic = Web3EthAbi.encodeEventSignature(
  AnyMoeAuctionCreateAuctionABI,
)

async function fetchNewAuctionInfo(mongodb, lbh, nbh) {
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

    await Token.insertOne(
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
