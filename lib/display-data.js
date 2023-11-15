const { logObject } = require('./util')

const GET_SPECS = true

async function displayData(httpAPIs, restAPIs, cfs, swaggerHub) {
  for (let cf of cfs) {
    console.log('-'.repeat(20).red)
    console.log(`Domain: [${cf.DomainName}] Description: [${cf.Comment}]`.green)
    if (cf.Aliases.Quantity > 0) {
      for (let alias of cf.Aliases.Items) {
        console.log(`  Alias=[${alias}]`.blue)
      }
    }

    if (cf.Origins.Quantity > 0) {
      console.log('Origins:'.green)
      for (let origin of cf.Origins.Items) {
        console.log(`  Origin Id=[${origin.Id}] DomainName=[${origin.DomainName}]`.blue)

        const httpsDomain = `https://${origin.DomainName}`
        let matchingAPI = httpAPIs.find((api) => api.ApiEndpoint === httpsDomain)
        let matchingAPIName = undefined
        if (matchingAPI) {
          matchingAPIName = matchingAPI.Name
          console.log(`    HTTP APIGateway=[${matchingAPI.Name}]`.grey)
          // logObject(matchingAPI)
          for (const stage of matchingAPI.stages) {
            // const stageUrl = `https://${api.id}.execute-api.eu-west-2.amazonaws.com/${stage}`
            console.log(`        Stage name=[${stage.StageName}]`.white)
          }

          for (const authorizer of matchingAPI.authorizers) {
            console.log(`        Authorizer Type=[${authorizer.AuthorizerType}] Name=[${authorizer.Name}] authorizerResultTtlInSeconds=[${authorizer.AuthorizerResultTtlInSeconds}]`.white)
          }
        } else {
          matchingAPI = restAPIs.find((api) => {
            const apiUrl = `https://${api.id}.execute-api.eu-west-2.amazonaws.com`
            return (apiUrl === httpsDomain)
          })
          if (matchingAPI) {
            matchingAPIName = matchingAPI.name
            console.log(`    REST APIGateway=[${matchingAPI.name}]`.white)
            for (const stage of matchingAPI.stages) {
              console.log(`        Stage name=[${stage.stageName}]`.white)
            }

            for (const authorizer of matchingAPI.authorizers) {
              console.log(`        Authorizer Type=[${authorizer.type}] Name=[${authorizer.name}] authorizerResultTtlInSeconds=[${authorizer.authorizerResultTtlInSeconds}]`.white)
            }
          }
        }

        if (GET_SPECS && matchingAPIName) {
          const searchName = matchingAPIName
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .split(' ')
            .map((word) => {
              if (word.length <= 3) {
                return ''
              } else {
                return word
              }
            })
            .filter((word) => word != '')
            .join(' ')
          // console.log(`    Looking for ${searchName}...`.yellow)
          const searchOptions = {
            specType: 'API',
            owner: 'AdvancedComputerSoft',
            query: searchName,
            // sort: 'UPDATED',
            sort: 'BEST_MATCH',
            order: 'DESC'
          }
          // try and link to swaggerhub
          const results = await swaggerHub.searchApisAndDomains(searchOptions, {})
          // console.log(JSON.stringify(results, null, 2))
          // console.log(results.totalCount)
          if (results.apis.length === 1) {
            const spec = results.apis[0]
            console.log(`        SwaggerHub Spec=[${spec.name}] Url=[${spec.properties[0].url}]`.cyan)
            console.log(`            Description=[${spec.description.split('\n')[0]}]`.cyan)
          } else if (results.apis.length > 0 && results.apis.length <= 5) {
            const spec = results.apis[0]
            console.log(`        Possible SwaggerHub Spec=[${spec.name}] Url=[${spec.properties[0].url}]`.yellow)
            console.log(`            Description=[${spec.description.split('\n')[0]}]`.yellow)
          } else {
            console.log(`        Couldn't resolve SwaggerHub using search '${searchName}'!`.yellow)
          }
        }
      }
    }
  }
}

// function displayAPIs(apis) {
//   for (let api of apis) {
//     console.log('-'.repeat(20))
//     console.log(`${api.Name}`)
//     console.log(`${JSON.stringify(api.Tags, null, 2)}`)
//   }
// }

// function displayCloudFronts(cfs) {
//   for (let cf of cfs) {
//     console.log('-'.repeat(20))
//     console.log(`${cf.DomainName}`)
//     if (cf.Aliases.Quantity > 0) {
//       for (let alias of cf.Aliases.Items) {
//         console.log(`  Alias=${alias}`)
//       }
//     } else {
//       console.log(`  Description=${cf.Description}`)
//     }
//     // console.log(`${JSON.stringify(cf, null, 2)}`)

//     if (cf.Origins.Quantity > 0) {
//       for (let origin of cf.Origins.Items) {
//         console.log(`Id=${origin.Id} DomainName=${origin.DomainName}`)
//       }
//     }
//   }
// }

module.exports = {
  displayData
}