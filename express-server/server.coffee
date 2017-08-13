express = require 'express'
path = require 'path'
bodyParser = require 'body-parser'
user = require './user'
analytics = require './analytics'
timeRouter = require('./time').timeRouter
authorizeRouter = require('./author').authorizeRouter

server = express()

# React Static File
server.use express.static('react-pages/build')
server.use (req, res, next) ->
  res.header "Access-Control-Allow-Origin", "*"
  next()

server.use '/user/*', authorizeRouter
server.use '/analyze/*', authorizeRouter

server.get '/user/message', (req, res) ->
  keyword = req.query.keyword || ''
  level = parseInt(req.query.level) || 0
  page = parseInt(req.query.page) || 0
  user.queryMessage([keyword, level, page]).then (result) -> res.json result

server.get '/user/message/count', (req, res) ->
  keyword = req.query.keyword || ''
  level = parseInt(req.query.level) || 0
  user.queryMessageCount([keyword, level]).then (result) -> res.end result.toString()

server.get '/user/:target_username', (req, res) ->
  target_username = req.params.target_username
  user.queryUser target_username, (result) ->
    res.json result

server.get '/user/ip/:target_ip', (req, res) ->
  target_ip = req.params.target_ip
  user.queryUserViaIp target_ip, (result) ->
    res.json result

server.post '/user/:target_username/dp/:value', (req, res) ->
  target_username = req.params.target_username
  dp = parseFloat req.params.value
  if dp == NaN
    res.statusCode = 400
    res.end "no dp"
    return
  user.setUserDp target_username, dp, ->
    res.end "ok"

server.use '/analyze/*', timeRouter

server.get '/analyze/history', (req, res) ->
  name = req.query.name || ''
  type = req.query.type || ''
  type = '' if type == 'all'
  page = parseInt(req.query.page) || 1
  analytics.queryHistory([name ,type, req.start_time, req.end_time, page]).then (result) -> res.json result

server.get '/analyze/history/count', (req, res) ->
  name = req.query.name || ''
  type = req.query.type || ''
  type = '' if type == 'all'
  analytics.queryHistoryCount([name, type, req.start_time, req.end_time]).then (result) -> res.end result.toString()

server.get '/analyze/deck', (req, res) ->
  name = req.query.name || ''
  source = req.query.source || ''
  page = parseInt(req.query.page) || 1
  analytics.queryDeck([name, source, req.start_time, req.end_time, page]).then (result) -> res.json result

server.get '/analyze/deck/count', (req, res) ->
  name = req.query.name
  source = req.query.source
  analytics.queryDeckCount([name, source, req.start_time, req.end_time]).then (result) -> res.end result.toString()

server.get '/analyze/custom', (req, res) ->
  analytics.runCommands(req.start_time, req.end_time).then (result) ->
    res.json result
  .catch (err) ->
    console.log err

server.get '/analyze/custom/commands', (req, res) ->
  res.sendFile path.resolve('express-server', 'analytics.json')

textParser = bodyParser.text()
server.post '/analyze/custom/commands', textParser, (req, res) ->
  try
    commands = JSON.parse req.body
  catch
    res.statusCode = 400
    res.end "Not correct json"
  analytics.setCommands commands
  res.end 'ok'

server.get '/analyze/daily', (req, res) ->
  type = req.query.type
  analytics.dailyCount(type).then (result) ->
    res.json result
  .catch (result) ->
    res.statusCode = 500
    res.end result

# React Router File
server.get '*', (req, res) ->
  res.sendFile path.resolve('react-pages/build', 'index.html')

server.listen 9999