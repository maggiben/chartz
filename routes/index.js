var express = require('express');
var router = express.Router();
var auth = require('../middlewares/auth');

router.route('/')
    .get(function (request, response, next) {
        return response.render('landing', {
            title: 'Dashboard',
            user: request.user
        });
    });

module.exports = router;
