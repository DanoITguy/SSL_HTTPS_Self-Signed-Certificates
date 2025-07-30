var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// MongoDB connection
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const authenticate = require('./authenticate');
const mongoose = require('mongoose');

const url = 'mongodb://127.0.0.1:27017/nucampsite';
const connect = mongoose.connect(url, {});

connect.then(() => console.log('Connected correctly to server'),
    err => console.log(err)
);

// Route imports
const campsiteRouter = require('./routes/campsiteRouter');
const partnerRouter = require('./routes/partnerRouter');
const promotionRouter = require('./routes/promotionRouter');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Secure traffic only - HTTPS redirect middleware
app.all('*', (req, res, next) => {
    if (req.secure) {
        return next();
    } else {
        console.log(`Redirecting to: https://${req.hostname}:${app.get('secPort')}${req.url}`);
        res.redirect(301, `https://${req.hostname}:${app.get('secPort')}${req.url}`);
    }
});

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('12345-67890-09876-54321'));

// Session middleware (required for Passport)
app.use(session({
    name: 'session-id',
    secret: '12345-67890-09876-54321',
    saveUninitialized: false,
    resave: false,
    cookie: {
        secure: false, // Set to true when using HTTPS in production
        maxAge: 1800000, // 30 minutes
        httpOnly: true
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes WITHOUT authentication (for easy testing)
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/campsites', campsiteRouter);
app.use('/partners', partnerRouter);
app.use('/promotions', promotionRouter);

//Routes WITH authentication (uncomment these and comment out the ones above when you want auth)
// app.use('/', indexRouter);
// app.use('/users', usersRouter);
// app.use('/campsites', auth, campsiteRouter);
// app.use('/partners', auth, partnerRouter);
// app.use('/promotions', auth, promotionRouter);

// Authentication function (ready to use when needed)
function auth(req, res, next) {
    console.log(req.user);
    
    if (!req.user) {
        if (!req.signedCookies.user) {
            const authHeader = req.headers.authorization;
            
            if (!authHeader) {
                const err = new Error('You are not authenticated!');
                res.setHeader('WWW-Authenticate', 'Basic');
                err.status = 401;
                return next(err);
            }
            
            const authData = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':');
            const user = authData[0];
            const pass = authData[1];
            
            if (user === 'admin' && pass === 'password') {
                res.cookie('user', 'admin', {signed: true});
                return next(); // authorized
            } else {
                const err = new Error('You are not authenticated!');
                res.setHeader('WWW-Authenticate', 'Basic');
                err.status = 401;
                return next(err);
            }
        } else {
            if (req.signedCookies.user === 'admin') {
                return next();
            } else {
                const err = new Error('You are not authenticated!');
                err.status = 401;
                return next(err);
            }
        }
    } else {
        return next();
    }
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;