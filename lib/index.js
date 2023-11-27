import {} from 'colors'

import datafire from 'datafire'

import { displayData, displayCloudFronts } from './display-data.js'
import { logObject } from './util.js'
import { getHttpAPIs, getHttpAPIStages, getHttpAPIAuthorisers, getHttpAPIDeployments, getHttpAPIRoutes, getHttpAPIIntegrations } from './http-api.js'
import { getRESTAPIs, getRESTAPIStages, getRESTAPIAuthorisers, getRESTAPIDeployments, getRESTAPIResources } from './rest-api.js'
// getRESTAPIRoutes, getRESTAPIIntegrations
import { getCloudFronts } from './cloudfront.js'
// import { getAccounts } from './client-sso.js'
import { getFunctions, getProvisionedConcurrency, getAliases } from './lambda.js'
import { readFileSync } from 'fs'

(async() => {  
  const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url)))

  const openapi = JSON.parse(readFileSync(new URL('./swaggerhub.json', import.meta.url)))
  const df = datafire.Integration.fromOpenAPI(openapi, "swaggerhub")
  const swaggerHub = df.create({
    TokenSecured: config.swaggerHubToken
  })
  
  let allCfs = []
  let allHttpAPIs = []
  let allRestAPIs = []
  let allFunctions = []

  // accounts = await getAccounts()
  const accounts = config.accounts
  const owner = config.swaggerHubOwner
  const fetchSpecs = config.swaggerFetchSpecs || false
  const getConcurrency = config.getConcurrency || false
// process.exit(0)

  for (const account of accounts.filter((account) => !account.disabled)) {
    console.log(`Processing account ${account.name}...`.green)

    const regions = account.regions || [ 'eu-west-2' ]
    for (const region of regions) {
      // cloud fronts are global so just get once for first region
      const isFirstRegion = (region === regions[0])

      console.log(`  Region ${region}...`.green)
      const {
        cfs,
        httpAPIs,
        restAPIs,
        functions
      } = await getAccountData(account, region, isFirstRegion, getConcurrency)
      allCfs = allCfs.concat(cfs)
      allHttpAPIs = allHttpAPIs.concat(httpAPIs)
      allRestAPIs = allRestAPIs.concat(restAPIs)
      allFunctions = allFunctions.concat(functions)
    }
  }

  console.log(`Found a total of ${allCfs.length} Cloud Fronts`.green)
  console.log(`Found a total of ${allRestAPIs.length} REST APIs`.green)
  console.log(`Found a total of ${allHttpAPIs.length} Http APIs`.green)
  console.log(`Found a total of ${allFunctions.length} Functions`.green)

  await displayData(allHttpAPIs, allRestAPIs, allCfs, allFunctions, { swaggerHub, owner, fetchSpecs })

  process.exit(0)
})()

async function getAccountData(account, region, isFirstRegion, getConcurrency) {
  const credentials = account.credentials

  let httpAPIs = []
  try {
    httpAPIs = await getHttpAPIs(credentials, account.name, region)

    if (httpAPIs.length > 0) {
      await getHttpAPIStages(credentials, httpAPIs)
      await getHttpAPIDeployments(credentials, httpAPIs)
      await getHttpAPIAuthorisers(credentials, httpAPIs)
      await getHttpAPIRoutes(credentials, httpAPIs)
      await getHttpAPIIntegrations(credentials, httpAPIs)
    }
  } catch (error) {
    console.error(`ERROR: ${error}`);
    process.exit(1);
  }

  let cfs = []
  if (isFirstRegion) {
    try {
      cfs = await getCloudFronts(credentials, account.name, region)
    } catch (error) {
      console.error(`ERROR: ${error}`);
      process.exit(1);
    }
    // displayCloudFronts(cfs)
  }

  let restAPIs = []
  try {
    restAPIs = await getRESTAPIs(credentials, account.name, region)

    if (restAPIs.length > 0) {
      await getRESTAPIStages(credentials, restAPIs)
      await getRESTAPIDeployments(credentials, restAPIs)
      await getRESTAPIAuthorisers(credentials, restAPIs)
      await getRESTAPIResources(credentials, restAPIs)
    }
  } catch (error) {
    console.error(`ERROR: ${error}`);
    process.exit(1);
  }

  let functions = []
  try {
    functions = await getFunctions(credentials, account.name, region)
    if (getConcurrency && functions.length > 0) {
      await getProvisionedConcurrency(credentials, functions, region)
    }
    // await getAliases(credentials, functions, region)
  } catch (error) {
    console.error(`ERROR: ${error}`);
    process.exit(1);
  }

  // displayAPIs(apis)

  //need route 53

  return {
    cfs,
    httpAPIs,
    restAPIs,
    functions
  }
}
