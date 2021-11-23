import Web3EthAbi from 'web3-eth-abi'
import {
  fetchEthereum,
  fetchIPFSJson,
  validateERC1155Json,
  getKnownProperties,
} from './utils/utils'
import isIPFS from 'is-ipfs'
import AnyMoeNFTMintNFTABI from './extra/AnyMoeNFT-MintNFT-ABI.json'

const AnyMoeNFTMintTopic = Web3EthAbi.encodeEventSignature(AnyMoeNFTMintNFTABI)

async function fetchNewTokenInfo(mongodb, lbh, nbh) {
  const Token = mongodb.db('AnyMoe').collection('Token')
  let logs = (
    await fetchEthereum({
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: lbh,
          toBlock: nbh,
          topics: [AnyMoeNFTMintTopic],
          address: ANYMOENFT_CONTRACT_ADDRESS,
        },
      ],
    })
  )['result']

  for (let log of logs) {
    if (log['data'] === '0x') continue
    log['topics'].shift()
    let mintLog = Web3EthAbi.decodeLog(
      AnyMoeNFTMintNFTABI["inputs"],
      log['data'],
      log['topics'],
    )
    let uri = mintLog['uri'].split('://')
    if (uri.length != 2) continue
    let scheme = uri[0]
    let path = uri[1]
    let metadata = null
    console.log(uri)

    switch (scheme) {
      case 'ipfs':
        path = '/ipfs/' + path
        if (isIPFS.path(path)) {
          metadata = await fetchIPFSJson(path)
        }
        break
      case 'ipns':
        path = '/ipns/' + path
        if (isIPFS.path(path)) {
          metadata = await fetchIPFSJson(path)
        }
    }

    if (metadata === null) continue
    if (!validateERC1155Json(metadata)) continue

    let tokenData = getKnownProperties(metadata, [
      'name',
      'description',
      'image',
      'decimals',
      'properties',
    ])
    let ownerData = {
      creator: mintLog['creator'],
      totalAmount: mintLog['amount'],
      owners: [
        {
          address: mintLog['to'],
          amount: mintLog['amount'],
        },
      ],
      auctions: [],
    }

    await Token.insertOne(
      Object.assign(
        {
          _id: mintLog['id'],
        },
        tokenData,
        ownerData,
      ),
    )
  }
}

async function fetchTokenTransfer(mongodb, lbh, nbh) {
  const Token = mongodb.db('AnyMoe').collection('Token')
  let logs = (
    await fetchEthereum({
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: lbh,
          toBlock: nbh,
          topics: [AnyMoeNFTMintTopic],
          address: ANYMOENFT_CONTRACT_ADDRESS,
        },
      ],
    })
  )['result']
}

export default {
  fetchNewTokenInfo,
  fetchTokenTransfer,
}
