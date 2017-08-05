{ mycardPool, ygoproPool, standardQueryCallback, standardPromiseCallback } = require './database'
custom_commands = require './analytics.json'
fs = require 'fs'

PAGE_LIMIT = 100
HISTORY_QUERY_SQL = "select * from battle_history where (usernamea like $1::text or usernameb like $1::text) and type like $2::text order by start_time desc limit #{PAGE_LIMIT} offset $3"
HISTORY_COUNT_SQL = "select count(*) from battle_history where (usernamea like $1::text or usernameb like $1::text) and type like $2::text"
DECK_QUERY_SQL = "select * from deck_day where (name like $1::text and source like $2::text) order by time desc, count desc, source desc limit #{PAGE_LIMIT} offset $3"
DECK_COUNT_SQL = "select count(*) from deck_day where name like $1::text and source like $2::text"
DAILY_COUNT =
  'SELECT day, sum(' +
  '      CASE' +
  '            WHEN sum_time < \'1 hour\' THEN 0' +
  '            WHEN sum_time < \'30 minute\' THEN 0.5' +
  '            ELSE 1' +
  '      END) AS day_active_users ' +
  'FROM' +
  '      (SELECT username, sum(time_length) AS sum_time, day FROM' +
  '            (SELECT usernamea AS username, end_time - battle_history.start_time AS time_length, date_trunc(\'day\', start_time) as day' +
  '                  FROM battle_history' +
  '                  WHERE type like $1::text' +
  '                  UNION SELECT usernameb AS username, end_time - battle_history.start_time AS time_length, date_trunc(\'day\', start_time) as day' +
  '                        FROM battle_history' +
  '                        WHERE type like $1::text) as B' +
  '      GROUP BY username, day) as user_time ' +
  'GROUP BY day ORDER BY day DESC LIMIT 100;'

runCommands = (callback) ->
  answer = []
  promises = []
  for command in custom_commands
    `let name = command.name`
    target_pool = if command.target == 'mycard' then mycardPool else ygoproPool
    promises.push target_pool.query(command.query).then (result) ->
      answer.push { name: name, result: result.rows }
  Promise.all(promises).then ->
    callback.call this, answer

setCommands = (commands) ->
  custom_commands = commands
  fs.writeFile './express-server/analytics.json', JSON.stringify(commands, null, 2), ->

queryHistory = (name, type, start, callback) ->
  type = "%" if type == 'all' or !type
  ygoproPool.query HISTORY_QUERY_SQL, ["%#{name}%", type, (start - 1) * PAGE_LIMIT], (err, result) ->
    if err
      console.log err
      callback.call this, []
    else
      callback.call this, result.rows

queryHistoryCount = (name, type, callback) ->
  type = "%" if type == 'all' or !type
  ygoproPool.query HISTORY_COUNT_SQL, ["%#{name}%", type], (err, result) ->
    if err
      console.log err
      callback.call this, 0
    else
      callback.call this, Math.ceil(result.rows[0].count / PAGE_LIMIT)

queryDeck = (name, source, start, callback) ->
  ygoproPool.query DECK_QUERY_SQL, ["%#{name}%", "%#{source}%", start], (err, result) ->
    if err
      console.log err
      callback.call this, []
    else
      callback.call this, result.rows

queryDeckCount = (name, source, callback) ->
  ygoproPool.query DECK_COUNT_SQL, ["%#{name}%", "%#{source}%"], (err, result) ->
    if err
      console.log err
      callback.call this, 0
    else
      callback.call this, Math.ceil(result.rows[0].count / PAGE_LIMIT)

dailyCount = (type) ->
  new Promise (resolve, reject) ->
    type = '%' if !type or type == 'all'
    ygoproPool.query DAILY_COUNT, [type], (err, result) -> standardPromiseCallback resolve, reject, err, result

module.exports.queryHistory = queryHistory
module.exports.queryHistoryCount = queryHistoryCount
module.exports.runCommands = runCommands
module.exports.setCommands = setCommands
module.exports.queryDeck = queryDeck
module.exports.queryDeckCount = queryDeckCount
module.exports.dailyCount = dailyCount