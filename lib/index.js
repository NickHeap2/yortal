require('colors')

const { ApiGatewayV2Client, GetApisCommand } = require('@aws-sdk/client-apigatewayv2')
const { CloudFrontClient, ListDistributionsCommand } = require('@aws-sdk/client-cloudfront')
// const { APIGatewayClient, GetRestApisCommand, GetStagesCommand, GetDeploymentsCommand } = require('@aws-sdk/client-api-gateway')
const { APIGatewayClient, GetRestApisCommand, GetStagesCommand } = require('@aws-sdk/client-api-gateway')

;(async() => {

  var config = require('../config.json')

  for (let account of config.accounts) {
    console.log(`Processing account ${account.name}...`.yellow)
    await getAccountData(account)
  }

  process.exit(0)
})()

async function getAccountData(account) {
  const credentials = account.credentials

  let httpAPIs
  try {
    httpAPIs = await getHttpAPIs(credentials)
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  // displayAPIs(apis)

  let restAPIs
  try {
    restAPIs = await getRESTAPIs(credentials)
    await getRESTAPIStages(credentials, restAPIs)
    // await getRESTAPIDeployments(credentials, restAPIs)
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  let cfs
  try {
    cfs = await getCloudFronts(credentials)
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  // displayCloudFronts(cfs)

  //need route 53

  displayData(httpAPIs, restAPIs, cfs)
}

function displayAPIs(apis) {
  for (let api of apis) {
    console.log('-'.repeat(20))
    console.log(`${api.Name}`)
    console.log(`${JSON.stringify(api.Tags, null, 2)}`)
  }
}

function displayCloudFronts(cfs) {
  for (let cf of cfs) {
    console.log('-'.repeat(20))
    console.log(`${cf.DomainName}`)
    if (cf.Aliases.Quantity > 0) {
      for (let alias of cf.Aliases.Items) {
        console.log(`  Alias=${alias}`)
      }
    }
    // console.log(`${JSON.stringify(cf, null, 2)}`)

    if (cf.Origins.Quantity > 0) {
      for (let origin of cf.Origins.Items) {
        console.log(`Id=${origin.Id} DomainName=${origin.DomainName}`)
      }
    }
  }
}

function displayData(httpAPIs, restAPIs, cfs) {
  for (let cf of cfs) {
    console.log('-'.repeat(20).red)
    console.log(`Domain: ${cf.DomainName}`.green)
    if (cf.Aliases.Quantity > 0) {
      for (let alias of cf.Aliases.Items) {
        console.log(`  Alias=${alias}`)
      }
    }

    if (cf.Origins.Quantity > 0) {
      console.log('Origins:'.green)
      for (let origin of cf.Origins.Items) {
        console.log(`  Origin Id=${origin.Id} DomainName=${origin.DomainName}`)

        const httpsDomain = `https://${origin.DomainName}`
        const matchingHTTPAPI = httpAPIs.find((api) => api.ApiEndpoint === httpsDomain)
        if (matchingHTTPAPI) {
          console.log(`    HTTP APIGateway=${matchingHTTPAPI.Name}`.white)
        }

        const matchingRESTAPI = restAPIs.find((api) => {
          const apiUrl = `https://${api.id}.execute-api.eu-west-2.amazonaws.com`
          return (apiUrl === httpsDomain)
          // for (let stage of api.stages) {
          //   const stageUrl = `https://${api.id}.execute-api.eu-west-2.amazonaws.com/${stage}`
          //   return (stageUrl === httpsDomain)
          // }
        })
        if (matchingRESTAPI) {
          console.log(`    REST APIGateway=${matchingRESTAPI.name}`.white)
        }
      }
    }
  }

}

async function getCloudFronts(credentials) {
  const client = new CloudFrontClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new ListDistributionsCommand(params)
  let cfList = []
  try {
    let data = {}
    do {
      console.log(`Fetching cf data for ${data.NextToken || ''}...`.yellow)
      command.input = { NextToken: data.NextToken }
      data = await client.send(command)
      // console.log(data)
      cfList = cfList.concat(data.DistributionList.Items)
    } while (data.NextToken)
  } catch (error) {
    throw error
  }

  return cfList
}

async function getHttpAPIs(credentials) {
  const client = new ApiGatewayV2Client({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetApisCommand(params)
  let apiList = []
  try {
    let data = {}
    do {
      console.log(`Fetching api data for ${data.NextToken || ''}...`.yellow)
      command.input = { NextToken: data.NextToken }
      data = await client.send(command)
      apiList = apiList.concat(data.Items)
    } while (data.NextToken)
  } catch (error) {
    if (error.name === 'AccessDeniedException') {
      return []
    }
    throw error
  }

  return apiList
}

async function getRESTAPIs(credentials) {
  const client = new APIGatewayClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetRestApisCommand(params)
  let apiList = []
  try {
    let data = {}
    do {
      console.log(`Fetching api data for ${data.NextToken || ''}...`.yellow)
      command.input = { NextToken: data.NextToken }
      data = await client.send(command)
      apiList = apiList.concat(data.items)
    } while (data.NextToken)
  } catch (error) {
    throw error
  }

  return apiList
}

async function getRESTAPIStages(credentials, restAPIs) {
  const client = new APIGatewayClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetStagesCommand(params)
  for (let restAPI of restAPIs) {
    command.input = {
      restApiId: restAPI.id
    }

    let stagesList = []
    try {
      console.log(`Fetching stages data for ${restAPI.id || ''}...`.yellow)
      const data = await client.send(command)
      stagesList = data.item
    } catch (error) {
      throw error
    }

    restAPI.stages = stagesList
  }
}


// async function getRESTAPIDeployments(credentials, restAPIs) {
//   const client = new APIGatewayClient({ region: "eu-west-2", credentials });

//   const params = {}
//   const command = new GetDeploymentsCommand(params)
//   for (let restAPI of restAPIs) {
//     command.input = {
//       restApiId: restAPI.id
//     }

//     let deploymentsList = []
//     try {
//       console.log(`Fetching deployments data for ${restAPI.id || ''}...`.yellow)
//       const data = await client.send(command)
//       deploymentsList = data.items
//     } catch (error) {
//       throw error
//     }

//     restAPI.deployments = deploymentsList
//   }
// }
