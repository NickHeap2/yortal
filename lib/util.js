import cliProgress from 'cli-progress'
import colors from 'ansi-colors'
import spinners from 'cli-spinners'
import ora from 'ora'

export function logObject(obj) {
  console.log(JSON.stringify(obj, null, 2))
}

export function startProgressBar(collection, type) {
  const bar = new cliProgress.SingleBar({
    format: `${type} |` + colors.yellow('{bar}') + '| {percentage}% || {value}/{total} || ID: {textValue}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })
  bar.start(collection.length, 0)

  return bar
}

export function startSpinner(text) {
  const spinner = ora({
    discardStdin: false,
    text,
    spinner: spinners.line
  })
  spinner.start()

  return spinner
}
