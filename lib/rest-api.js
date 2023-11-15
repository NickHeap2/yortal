const { APIGatewayClient, GetRestApisCommand, GetStagesCommand, GetDeploymentsCommand, GetAuthorizersCommand, GetModelCommand, GetResourcesCommand } = require('@aws-sdk/client-api-gateway')

const { logObject } = require('./util')

async function getRESTAPIs(credentials) {
  const client = new APIGatewayClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetRestApisCommand(params)
  let apiList = []
  try {
    let data = {}
    do {
      console.log(`  Fetching REST APIs from ${data.NextToken || 'start'}...`.yellow)
      command.input = { NextToken: data.NextToken }
      data = await client.send(command)
      apiList = apiList.concat(data.items)
    } while (data.NextToken)
  } catch (error) {
    throw error
  }

  return apiList
}

async function getRESTAPIStages(credentials, apis) {
  const client = new APIGatewayClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetStagesCommand(params)
  for (let api of apis) {
    command.input = {
      restApiId: api.id,
      limit: 100
    }

    let stagesList = []
    try {
      console.log(`  Fetching REST API stages data for ${api.id || ''}...`.yellow)
      const data = await client.send(command)
      stagesList = data.item
    } catch (error) {
      throw error
    }

    api.stages = stagesList
  }
}

async function getRESTAPIDeployments(credentials, restAPIs) {
  const client = new APIGatewayClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetDeploymentsCommand(params)
  for (let restAPI of restAPIs) {
    command.input = {
      restApiId: restAPI.id
    }

    let deploymentsList = []
    try {
      console.log(`  Fetching REST API deployments for ${restAPI.id || ''}...`.yellow)
      const data = await client.send(command)
      deploymentsList = data.items
    } catch (error) {
      throw error
    }

    restAPI.deployments = deploymentsList
  }
}

async function getRESTAPIAuthorisers(credentials, apis) {
  const client = new APIGatewayClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetAuthorizersCommand(params)
  for (let api of apis) {
    command.input = {
      restApiId: api.id
    }

    let authorizersList = []
    try {
      console.log(`  Fetching REST API authorizers data for ${api.id || ''}...`.yellow)
      const data = await client.send(command)
      authorizersList = data.items
    } catch (error) {
      throw error
    }

    api.authorizers = authorizersList
  }
}

module.exports = {
  getRESTAPIs,
  getRESTAPIStages,
  getRESTAPIAuthorisers,
  getRESTAPIDeployments
}
