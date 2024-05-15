import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { AddressInfo } from 'net'

import routes from './routes';

const start = async () => {

  //
  // Setup ExpressJS middleware, routes, etc
  //
  const app = express()
  app.use(cors())
  app.use(bodyParser.json())
  app.use(bodyParser.raw({ type: '*/*' }))
  app.use(function (err, req, res, next) {
    console.log('requested')
    next()
  })
  app.use(routes)

  //
  // Set port and start ExpressJS Server
  //
  const server = app.listen(3000)
  const address = server.address() as AddressInfo
  console.log('Starting ExpressJS server')
  console.log(`ExpressJS listening at http://${address.address}:${address.port}`)
}

start()