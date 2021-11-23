import * as Realm from 'realm-web'
import {
  fetchEthereum,
  fetchIPFSJson,
  validateERC1155Json,
  getKnownProperties,
} from './utils/utils'
import TokenInfo from './token-info'

const dbapp = new Realm.App({ id: MONGODB_REALM_APPID })
const credentials = Realm.Credentials.apiKey(MONGODB_REALM_APIKEY)

async function handleScheduled(event) {
  const dbuser = await dbapp.logIn(credentials)
  const mongodb = dbuser.mongoClient('mongodb-atlas')
  let NowBlockHeight = (
    await fetchEthereum({
      method: 'eth_blockNumber',
      params: [],
    })
  )['result']
  let LastBlockHeight = await STATE.get('LastBlockHeight')
  await STATE.put('LastBlockHeight', NowBlockHeight)

  TokenInfo.fetchNewTokenInfo(mongodb, LastBlockHeight, NowBlockHeight)
}

addEventListener('scheduled', event => {
  event.waitUntil(handleScheduled(event))
})
