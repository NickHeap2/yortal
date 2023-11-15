require('colors')

const config = require('../config.json')

const { displayData } = require('./display-data')
const { logObject } = require('./util')

const { getHttpAPIs, getHttpAPIStages, getHttpAPIAuthorisers, getHttpAPIDeployments } = require('./http-api')
const { getRESTAPIs, getRESTAPIStages, getRESTAPIAuthorisers, getRESTAPIDeployments } = require('./rest-api')

const { getCloudFronts } = require('./cloudfront')

const owner = config.swaggerHubOwner

const swaggerHub = require('@datafire/swaggerhub').create({
  TokenSecured: config.swaggerHubToken
})

;(async() => {
  
  let allCfs = []
  let allHttpAPIs = []
  let allRestAPIs = []
  for (let account of config.accounts) {
    console.log(`Processing account ${account.name}...`.yellow)
    const {
      cfs,
      httpAPIs,
      restAPIs
    } = await getAccountData(account)
    allCfs = allCfs.concat(cfs)
    allHttpAPIs = allHttpAPIs.concat(httpAPIs)
    allRestAPIs = allRestAPIs.concat(restAPIs)
  }

  await displayData(allHttpAPIs, allRestAPIs, allCfs, swaggerHub, owner)

  process.exit(0)
})()

async function getAccountData(account) {
  const credentials = account.credentials

  let httpAPIs
  try {
    httpAPIs = await getHttpAPIs(credentials)
  } catch (error) {
    console.error(`ERROR: ${error}`);
    process.exit(1);
  }
  // displayAPIs(apis)

  let restAPIs
  try {
    restAPIs = await getRESTAPIs(credentials)
    await getRESTAPIStages(credentials, restAPIs)
    await getHttpAPIStages(credentials, httpAPIs)

    await getRESTAPIDeployments(credentials, restAPIs)
    await getHttpAPIDeployments(credentials, httpAPIs)
    
    await getRESTAPIAuthorisers(credentials, restAPIs)
    await getHttpAPIAuthorisers(credentials, httpAPIs)
  } catch (error) {
    console.error(`ERROR: ${error}`);
    process.exit(1);
  }

  let cfs
  try {
    cfs = await getCloudFronts(credentials)
  } catch (error) {
    console.error(`ERROR: ${error}`);
    process.exit(1);
  }
  // displayCloudFronts(cfs)

  //need route 53

  return {
    cfs,
    httpAPIs,
    restAPIs
  }
}
