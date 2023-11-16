const { APIGatewayClient, GetRestApisCommand, GetStagesCommand, GetDeploymentsCommand, GetAuthorizersCommand, GetModelCommand, GetResourcesCommand } = require('@aws-sdk/client-api-gateway')

const { logObject, startProgressBar } = require('./util')

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

  const bar = startProgressBar(apis, 'Fetching REST API stages')
  for (let api of apis) {
    command.input = {
      restApiId: api.id,
      limit: 100
    }

    let stagesList = []
    try {
      // console.log(`  Fetching REST API stages data for ${api.id || ''}...`.yellow)
      const data = await client.send(command)
      stagesList = data.item
    } catch (error) {
      throw error
    }

    api.stages = stagesList

    bar.increment(1, { textValue: api.id })
  }
  bar.stop()
}

async function getRESTAPIDeployments(credentials, apis) {
  const client = new APIGatewayClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetDeploymentsCommand(params)

  const bar = startProgressBar(apis, 'Fetching REST API deployments')
  for (let api of apis) {
    command.input = {
      restApiId: api.id
    }

    let deploymentsList = []
    try {
      // console.log(`  Fetching REST API deployments for ${api.id || ''}...`.yellow)
      const data = await client.send(command)
      deploymentsList = data.items
    } catch (error) {
      throw error
    }

    api.deployments = deploymentsList

    bar.increment(1, { textValue: api.id })
  }
  bar.stop()
}

async function getRESTAPIAuthorisers(credentials, apis) {
  const client = new APIGatewayClient({ region: "eu-west-2", credentials });

  const params = {}
  const command = new GetAuthorizersCommand(params)

  const bar = startProgressBar(apis, 'Fetching REST API authorizers')
  for (let api of apis) {
    command.input = {
      restApiId: api.id
    }

    let authorizersList = []
    try {
      // console.log(`  Fetching REST API authorizers data for ${api.id || ''}...`.yellow)
      const data = await client.send(command)
      authorizersList = data.items
    } catch (error) {
      throw error
    }

    api.authorizers = authorizersList

    bar.increment(1, { textValue: api.id })
  }
  bar.stop()
}

module.exports = {
  getRESTAPIs,
  getRESTAPIStages,
  getRESTAPIAuthorisers,
  getRESTAPIDeployments
}
