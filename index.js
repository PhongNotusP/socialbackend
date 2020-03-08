const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');

const users = require('./controllers/api/users');
const profile = require('./controllers/api/profile');
const stories = require('./controllers/api/stories');
const groups = require('./controllers/api/groups');
const events = require('./controllers/api/events');
const friends = require('./controllers/api/friends');
const messages = require('./controllers/api/messages');
const comments = require('./controllers/api/comments');
const fileupload = require('./controllers/api/fileupload');
var cors = require('cors')
require('./config/seedDb');
const app = express();

//Body-Parser
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(cors());
require('./config/connectDB');
require('./fileupload');

//passport
app.use(passport.initialize());
//passport config
require('./config/passport')(passport);

app.use('/api/users', users);
app.use('/api/profile', profile);
app.use('/api/stories', stories);
app.use('/api/groups', groups);
app.use('/api/events', events);
app.use('/api/friends', friends);
app.use('/api/messages', messages);
app.use('/api/comments', comments);
app.use('/api/fileupload', fileupload);

const port = process.env.PORT || 1234;

app.listen(port, () => console.log('Server đang khởi động'));