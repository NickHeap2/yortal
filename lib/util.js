const cliProgress = require('cli-progress');
const colors = require('ansi-colors');

function logObject(obj) {
  console.log(JSON.stringify(obj, null, 2))
}

function startProgressBar(collection, type) {
  const bar = new cliProgress.SingleBar({
    format: `${type} |` + colors.yellow('{bar}') + '| {percentage}% || {value}/{total} || ID: {textValue}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })
  bar.start(collection.length, 0)

  return bar
}

module.exports = {
  logObject,
  startProgressBar
}