#! /usr/bin/env node
const { spawn } = require('child_process')
const fs = require('fs')

const mySpawn = cmd => spawn(cmd, { shell: true, stdio: 'inherit' })

let command
let multiPartCommand = false
const scriptName = process.argv[2]

const nodemonCommand =
  './node_modules/.bin/nodemon -w src -i dist -x "./node_modules/.bin/babel-node src/_server/server.js"'

const clientWatch = './node_modules/.bin/webpack --mode=development --watch'

const rmLib = './node_modules/.bin/rimraf lib'
const rmDist = './node_modules/.bin/rimraf dist'
const rmCache = './node_modules/.bin/rimraf .cache' // For Parcel
const rmDistCache = [rmDist, rmCache].join(' && ')

const eslint = './node_modules/.bin/eslint src'
const flow = './node_modules/.bin/flow'
const madge = './node_modules/.bin/madge --circular src'
const lint = [eslint, flow, madge].join(' && ')
const test = './node_modules/.bin/jest --coverage'

const dockerUp = 'docker-compose up -d'
const dockerWaitPg =
  'until docker run --rm --link db:pg --net js-stack-net postgres:latest pg_isready -U postgres -h pg; do sleep 1; done'

const dbMigr = './node_modules/.bin/knex --knexfile src/_db/knex-config.js --cwd . migrate:latest'
const dbSeed = './node_modules/.bin/knex --knexfile src/_db/knex-config.js --cwd . seed:run'

const clientBuild = './node_modules/.bin/webpack --mode=production'
const babel = './node_modules/.bin/babel src -d lib --ignore "**/*.test.js"'
const prodBuild = [rmDistCache, rmLib, clientBuild, babel].join(' && ')

const localServerSetup = [dockerUp, dockerWaitPg, dbMigr, dbSeed].join(' && ')

const runLocalSetupThenServer = (serverCommand, runClientWatch = true) => {
  multiPartCommand = true
  if (fs.existsSync(`${process.cwd()}/docker-compose.yml`)) {
    const firstSpawn = mySpawn(localServerSetup)
    firstSpawn.on('close', code => {
      if (code === 0) {
        mySpawn(serverCommand)
        if (runClientWatch) {
          mySpawn([rmDistCache, clientWatch].join(' && '))
        }
      }
    })
  } else {
    mySpawn(serverCommand)
    if (runClientWatch) {
      mySpawn([rmDistCache, clientWatch].join(' && '))
    }
  }
}

switch (scriptName) {
  case 'dev': {
    runLocalSetupThenServer(nodemonCommand)
    break
  }
  case 'dev-server-only': {
    runLocalSetupThenServer(
      `./node_modules/.bin/cross-env USE_CLIENT_BUNDLE=false ${nodemonCommand}`,
      false,
    )
    break
  }
  case 'dev-client-only': {
    runLocalSetupThenServer(`./node_modules/.bin/cross-env ENABLE_SSR=false ${nodemonCommand}`)
    break
  }
  case 'prod-local': {
    const herokuLocal = 'cross-env NODE_ENV=production heroku local'
    command = [localServerSetup, prodBuild, herokuLocal].join(' && ')
    break
  }
  case 'lint': {
    command = lint
    break
  }
  case 'test': {
    command = test
    break
  }
  case 'lint-test': {
    command = [lint, test].join(' && ')
    break
  }
  default:
    // eslint-disable-next-line no-console
    console.error(`${process.argv[2]} is not a valid @sharyn/cli command.`)
    process.exit(1)
}

if (!multiPartCommand) {
  mySpawn(command)
}
