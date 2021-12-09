import * as Realm from 'realm-web'
import TokenInfo from './token-info'

const dbapp = new Realm.App({ id: MONGODB_REALM_APPID })
const credentials = Realm.Credentials.apiKey(MONGODB_REALM_APIKEY)

async function handleScheduled(event) {
  const dbuser = await dbapp.logIn(credentials)
  let NowBlockHeight = (
    await fetchEthereum({
      method: 'eth_blockNumber',
      params: [],
    })
  )['result']
  let LastBlockHeight = await STATE.get('LastBlockHeight')
  await STATE.put('LastBlockHeight', NowBlockHeight)
  //let LastBlockHeight = "earliest"
  //let NowBlockHeight = "latest"

  await TokenInfo.fetchNewTokenInfo(dbuser, LastBlockHeight, NowBlockHeight),
  await TokenInfo.fetchTokenTransfer(dbuser, LastBlockHeight, NowBlockHeight)
}

addEventListener('scheduled', event => {
  event.waitUntil(handleScheduled(event))
})
