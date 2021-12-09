import Web3EthAbi from 'web3-eth-abi'
import {
  fetchEthereum,
  fetchIPFSJson,
  validateERC1155Json,
  getKnownProperties,
} from './utils/utils'
import isIPFS from 'is-ipfs'
import AnyMoeNFTMintNFTABI from './extra/AnyMoeNFT-MintNFT-ABI.json'
import AnyMoeNFTTransferBatchABI from './extra/AnyMoeNFT-TransferBatch-ABI.json'
import AnyMoeNFTTransferSingleABI from './extra/AnyMoeNFT-TransferSingle-ABI.json'

const AnyMoeNFTMintTopic = Web3EthAbi.encodeEventSignature(AnyMoeNFTMintNFTABI)
const AnyMoeNFTTransferBatchTopic = Web3EthAbi.encodeEventSignature(
  AnyMoeNFTTransferBatchABI,
)
const AnyMoeNFTTransferSingleTopic = Web3EthAbi.encodeEventSignature(
  AnyMoeNFTTransferSingleABI,
)

async function fetchNewTokenInfo(mongodb, lbh, nbh) {
  const Token = mongodb
    .mongoClient('mongodb-atlas')
    .db('AnyMoe')
    .collection('Token')
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
      AnyMoeNFTMintNFTABI['inputs'],
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
      'properties',
    ])
    let owners = {}
    owners[mintLog['to']] = parseInt(mintLog['amount'])
    let ownerData = {
      creator: mintLog['creator'],
      totalAmount: parseInt(mintLog['amount']),
      owners: owners,
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
  const Token = mongodb
    .mongoClient('mongodb-atlas')
    .db('AnyMoe')
    .collection('Token')
  let logs = (
    await fetchEthereum({
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: lbh,
          toBlock: nbh,
          topics: [AnyMoeNFTTransferSingleTopic],
          address: ANYMOENFT_CONTRACT_ADDRESS,
        },
      ],
    })
  )['result']
  for (let log of logs) {
    if (log['data'] === '0x') continue
    log['topics'].shift()
    let transferSingleLog = Web3EthAbi.decodeLog(
      AnyMoeNFTTransferSingleABI['inputs'],
      log['data'],
      log['topics'],
    )
    let incOp = {}
    incOp['owners.' + transferSingleLog['from']] = -parseInt(
      transferSingleLog['value'],
    )
    incOp['owners.' + transferSingleLog['to']] = parseInt(
      transferSingleLog['value'],
    )
    await Token.updateOne(
      { _id: transferSingleLog['id'] },
      {
        $inc: incOp,
      },
    )
  }

  logs = (
    await fetchEthereum({
      method: 'eth_getLogs',
      params: [
        {
          fromBlock: lbh,
          toBlock: nbh,
          topics: [AnyMoeNFTTransferBatchTopic],
          address: ANYMOENFT_CONTRACT_ADDRESS,
        },
      ],
    })
  )['result']
  for (let log of logs) {
    if (log['data'] === '0x') continue
    log['topics'].shift()
    let transferBatchLog = Web3EthAbi.decodeLog(
      AnyMoeNFTTransferBatchABI['inputs'],
      log['data'],
      log['topics'],
    )
    for (let i = 0; i < transferBatchLog['ids'].length; i++) {
      incOp = {}
      incOp['owners.' + transferBatchLog['from']] = -parseInt(
        transferBatchLog['values'][i],
      )
      incOp['owners.' + transferBatchLog['to']] = parseInt(
        transferBatchLog['values'][i],
      )
      await Token.updateOne(
        { _id: transferBatchLog['ids'][i] },
        {
          $inc: incOp,
        },
      )
    }
  }
}

export default {
  fetchNewTokenInfo,
  fetchTokenTransfer,
}
