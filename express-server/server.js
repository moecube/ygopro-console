// Generated by CoffeeScript 2.0.0-beta3
(function() {
  var analytics, authorizeRouter, express, path, server, user;

  express = require('express');

  user = require('./user');

  analytics = require('./analytics');

  authorizeRouter = require('./author').authorizeRouter;

  path = require('path');

  server = express();

  server.use(express.static('react-pages/build'));

  server.use('/analytics/*', authorizeRouter);

  server.use('/user/*', authorizeRouter);

  server.get('/user/:target_username', function(req, res) {
    var target_username;
    target_username = req.params.target_username;
    return user.queryUser(target_username, function(result) {
      return res.json(result);
    });
  });

  server.post('/user/:target_username/dp/:value', function(req, res) {
    var dp, target_username;
    target_username = req.params.target_username;
    dp = parseFloat(req.params.value);
    if (dp === (0/0)) {
      res.statusCode = 400;
      res.end("no dp");
      return;
    }
    return user.setUserDp(target_username, dp, function() {
      return res.end("ok");
    });
  });

  server.get('/analytics/history', function(req, res) {
    var name, page, type;
    name = req.query.name;
    type = req.query.type;
    page = req.query.page;
    if (!page) {
      page = 1;
    }
    return analytics.queryHistory(name, type, page, function(result) {
      return res.json(result);
    });
  });

  server.get('/analytics/history/count', function(req, res) {
    var name, type;
    name = req.query.name;
    type = req.query.type;
    return analytics.queryHistoryCount(name, type, function(result) {
      return res.end(result.toString());
    });
  });

  server.get('*', function(req, res) {
    return res.sendFile(path.resolve('react-pages/build', 'index.html'));
  });

  server.listen(9999);

}).call(this);

//# sourceMappingURL=server.js.map
