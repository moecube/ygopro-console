// Generated by CoffeeScript 2.0.0-beta3
(function() {
  var DAILY_COUNT, DECK_COUNT_SQL, DECK_QUERY_SQL, HISTORY_COUNT_SQL, HISTORY_QUERY_SQL, PAGE_LIMIT, custom_commands, dailyCount, database, fs, mycardPool, runCommands, setCommands, ygoproPool;

  database = require('./database');

  mycardPool = database.mycardPool;

  ygoproPool = database.ygoproPool;

  custom_commands = require('./analytics.json');

  fs = require('fs');

  PAGE_LIMIT = 100;

  HISTORY_QUERY_SQL = `select * from battle_history where (usernamea like $1::text or usernameb like $1::text) and type like $2::text and start_time >= $3 and start_time <= $4 order by start_time desc limit ${PAGE_LIMIT} offset $5`;

  HISTORY_COUNT_SQL = "select count(*) from battle_history where (usernamea like $1::text or usernameb like $1::text) and type like $2::text and start_time >= $3 and start_time <= $4 ";

  DECK_QUERY_SQL = `select name, source, sum(count) sc from deck_day where (name like $1::text and source like $2::text) and time >= $3 and time <= $4 group by name, source order by sc desc, source desc limit ${PAGE_LIMIT} offset $5`;

  DECK_COUNT_SQL = "select count(*) from (select sum(count) sc from deck_day where (name like $1::text and source like $2::text) and time >= $3 and time <= $4 group by name, source) as counts";

  DAILY_COUNT = 'SELECT day, sum(' + '      CASE' + '            WHEN sum_time < \'1 hour\' THEN 0' + '            WHEN sum_time < \'30 minute\' THEN 0.5' + '            ELSE 1' + '      END) AS day_active_users ' + 'FROM' + '      (SELECT username, sum(time_length) AS sum_time, day FROM' + '            (SELECT usernamea AS username, end_time - battle_history.start_time AS time_length, date_trunc(\'day\', start_time) as day' + '                  FROM battle_history' + '                  WHERE type like $1::text' + '                  UNION SELECT usernameb AS username, end_time - battle_history.start_time AS time_length, date_trunc(\'day\', start_time) as day' + '                        FROM battle_history' + '                        WHERE type like $1::text) as B' + '      GROUP BY username, day) as user_time ' + 'GROUP BY day ORDER BY day DESC LIMIT 100;';

  runCommands = function(start_time, end_time) {
    var answer, command, i, len, promises, query_parameters, query_time_args, target_pool;
    answer = [];
    promises = [];
    query_time_args = [start_time.format('YYYY-MM-DD HH:mm:ss'), end_time.format('YYYY-MM-DD HH:mm:ss')];
    for (i = 0, len = custom_commands.length; i < len; i++) {
      command = custom_commands[i];
      let name = command.name;
      let tag = command.tag;
      target_pool = command.target === 'mycard' ? mycardPool : ygoproPool;
      query_parameters = command.time ? query_time_args : [];
      promises.push(target_pool.query(command.query, query_parameters).then(function(result) {
        return answer.push({
          name: name,
          result: result.rows,
          tag: tag
        });
      }));
    }
    return Promise.all(promises).then(function(result) {
      var j, len1, order, ordered_answers;
      ordered_answers = [];
      for (j = 0, len1 = result.length; j < len1; j++) {
        order = result[j];
        ordered_answers.push(answer[order - 1]);
      }
      return ordered_answers;
    });
  };

  setCommands = function(commands) {
    custom_commands = commands;
    return fs.writeFile('./express-server/analytics.json', JSON.stringify(commands, null, 2), function() {});
  };

  Object.assign(module.exports, database.defineStandatdQueryFunctions('queryHistory', database.ygoproPool, HISTORY_QUERY_SQL, HISTORY_COUNT_SQL, PAGE_LIMIT));

  Object.assign(module.exports, database.defineStandatdQueryFunctions('queryDeck', database.ygoproPool, DECK_QUERY_SQL, DECK_COUNT_SQL, PAGE_LIMIT));

  dailyCount = function(type) {
    return new Promise(function(resolve, reject) {
      if (!type || type === 'all') {
        type = '%';
      }
      return ygoproPool.query(DAILY_COUNT, [type], function(err, result) {
        return database.standardPromiseCallback(resolve, reject, err, result);
      });
    });
  };

  module.exports.runCommands = runCommands;

  module.exports.setCommands = setCommands;

  module.exports.dailyCount = dailyCount;

}).call(this);

//# sourceMappingURL=analytics.js.map
