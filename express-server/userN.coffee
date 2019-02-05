database = require './database'
moment = require 'moment'
express = require 'express'
config = require './config.json'
mycardPool = database.mycardPool
ygoproPool = database.ygoproPool

route_user = (route) ->
    route.count_get '/search',                user_search_name,     { user: "s" }
    route.count_get '/search/name',           user_search_name,     { user: "s" }
    route.count_get '/search/ip',             user_search_ip,       { ip: "o" }
    route.quick_get '/detail/:user/mc',       user_detail_mcuser,   { user: "o" }
    route.quick_get '/detail/:user/usedname', user_detail_usedname, { user: "o" }
    route.quick_get '/detail/:user/userinfo', user_detail_userinfo, { user: "o" }
    route.count_get '/detail/:user/ban',      user_banned_history,  { user: "o" }
    route.count_get '/detail/:user/score',    user_score_history,   { user: "o" }
    route.quick_post '/:user/pt',             user_set_pt,          { user: "o", value: "f" }
    route.quick_post '/:user/exp',            user_set_exp,         { user: "o", value: "f" }
    route.quick_post '/:user/ban',            user_set_ban,         { user: "o", value: "i" }

SQL_USER_SEARCH_NAME = "select * from users where name like $1::text or username like $1::text order by id limit #{config.limitCount} offset $2::integer"
SQL_USER_SEARCH_NAME_COUNT = 'select count(*) from users where name like $1::text or username like $1::text'
user_search_name = (username, page = 0) -> 
    await database.standardCountedPGQuery mycardPool, SQL_USER_SEARCH_NAME, SQL_USER_SEARCH_NAME_COUNT, [username, page]

SQL_USER_SEARCH_IP = "select * from users where ip_address = $1::text or registration_ip_address = $1::text order by id limit #{config.limitCount} offset $2::integer"
SQL_USER_SEARCH_IP_COUNT = 'select count(*) from users where ip_address = $1::text or registration_ip_address = $1::text'
user_search_ip = (ip, page = 0) ->
    await database.standardCountedPGQuery mycardPool, SQL_USER_SEARCH_IP, SQL_USER_SEARCH_IP_COUNT, [ip, page]

SQL_USER_DETAIL_MCUSER = "select * from users where username = $1::text"
user_detail_mcuser = (username) ->
    await database.standardPGQuery mycardPool, SQL_USER_DETAIL_MCUSER, [username]

SQL_USER_USEDNAME = 'select * from username_change_history where change_time < $1 and new_username = $2 limit 1'
user_detail_usedname = (username) ->
    names = []
    name = username
    time = moment().format('YYYY-MM-DD HH:mm:ss')
    while true
        query = await mycardPool.query SQL_USER_USEDNAME, [time, name]
        if query.rows.length == 0
            return names
        else
            row = query.rows[0]
            names.push row
            name = row.old_username
            time = row.change_time
    return names

SQL_USER_DETAIL_USERINFO = "select * from user_info where username = $1::text"
user_detail_userinfo = (username) ->
    await database.standardPGQuery ygoproPool, SQL_USER_DETAIL_USERINFO, [username]

SQL_USER_BANNED_HISTORY = "select * from user_ban_history where username = $1::text limit 5 offset $2::integer"
SQL_USER_BANNED_HISTORY_COUNT = "select count(*) from user_ban_history where username = $1::text"
user_banned_history = (username, page = 0) ->
    await database.standardCountedPGQuery ygoproPool, SQL_USER_BANNED_HISTORY, SQL_USER_BANNED_HISTORY_COUNT, [username, page], 5

SQL_USER_SCORE_HISTORY = "select * from user_historical_record where username = $1::text order by season desc limit 5 offset $2::integer"
SQL_USER_SCORE_HISTORY_COUNT = "select count(*) from user_historical_record where username = $1::text"
user_score_history = (username, page = 0) ->
    await database.standardCountedPGQuery ygoproPool, SQL_USER_SCORE_HISTORY, SQL_USER_SCORE_HISTORY_COUNT, [username, page], 5

SQL_USER_SET_PT = "update user_info set pt = $1::double precision where username = $2::text"
user_set_pt = (username, value) ->
    await database.standardPGQuery ygoproPool, SQL_USER_SET_PT, [value, username]

SQL_USER_SET_EXP = "update user_info set exp = $1::double precision where username = $2::text"
user_set_exp = (username, value) ->
    await database.standardPGQuery ygoproPool, SQL_USER_SET_EXP, [value, username]

SQL_USER_BAN = "insert into user_ban_history values($1::string, $2::timestamp, $3::timestamp)"
user_set_ban = (username, hours) ->
    _from = moment()
    to = moment().add(hours, 'hour')
    await database.standardCountedPGQuery ygoproPool, SQL_USER_BAN, [username, _from, to]

route_message = (route) ->
route_vote = (route) ->

route = express.Router()

route.quick_get = (path, func, param_patterns) ->
    names = Object.keys param_patterns
    types = Object.values param_patterns
    route.get path, (req, res) ->
        function_params = database.formatRequestParams types, names, Object.assign req.query, req.params
        res.json await func.call route, ...function_params
        
route.quick_post = (path, func, param_patterns) ->
    names = Object.keys param_patterns
    types = Object.values param_patterns
    route.post path, (req, res) ->
        function_params = database.formatRequestParams types, names, Object.assign req.query, req.params
        res.json await func.call route, ...function_params

route.count_get = (path, func, param_patterns) ->
    names = Object.keys param_patterns
    types = Object.values param_patterns
    route.get path + "/count", (req, res) ->
        function_params = database.formatRequestParams types, names, Object.assign req.query, req.params
        res.json await func.call route, ...function_params, -1
    param_patterns["page"] = "i"
    this.quick_get path, func, param_patterns

route_user route
route_message route
route_vote route
module.exports = route