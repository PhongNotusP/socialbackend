const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const multer = require('multer');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const passport = require('passport');
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// router.get('/:id', (req,res) => {
//     function authorize(credentials, callback) {
//         const {client_secret, client_id, redirect_uris} = credentials.installed;
//         const oAuth2Client = new google.auth.OAuth2(
//             client_id, client_secret, redirect_uris[0]);
      
//         // Check if we have previously stored a token.
//         fs.readFile(TOKEN_PATH, (err, token) => {
//           if (err) return getAccessToken(oAuth2Client, callback);
//           oAuth2Client.setCredentials(JSON.parse(token));
//           callback(oAuth2Client, 'id cua file'); //getfile
//         });
//       }
//     // Load client secrets from a local file.
//     fs.readFile('credentials.json', (err, content) => {
//         if (err) return console.log('Error loading client secret file:', err);
//         // Authorize a client with credentials, then call the Google Drive API.
//         authorize(JSON.parse(content), getFile);
//     });
// });
router.get('/all', (req,res) => {
    async function listFiles(auth) {
        const drive = google.drive({ version: 'v3', auth });
        await getList(drive, '');
    }
    async function getList(drive, pageToken) {
        await drive.files.list({
            corpora: 'user',
            pageSize: 10,
            //q: "name='elvis233424234'",
            pageToken: pageToken ? pageToken : '',
            fields: 'nextPageToken, files(id,name)',
        }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const files = res.data.files;
            if (files.length) {
                console.log('Files:');
                processList(files);
                if (res.data.nextPageToken) {
                    getList(drive, res.data.nextPageToken);
                }
    
                // files.map((file) => {
                //     console.log(`${file.name} (${file.id})`);
                // });
            } else {
                console.log('No files found.');
            }
        });
    }
    async function processList(files) {
        console.log('Processing....');
        await files.forEach(file => {
            // console.log(file.name + '|' + file.size + '|' + file.createdTime + '|' + file.modifiedTime);
            console.log(file);
            res.json(file);
        });
    }
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Drive API.
        authorize(JSON.parse(content), listFiles);
    });
});

//upload
const storage = multer.diskStorage({
    destination:(req, file, callback) => {
        callback(null,'./upload/');
    },
    filename: (req, file, callback) => {
        const extension = file.mimetype.split('/')[1];
        callback(null, file.originalname + '-' + Date.now() + '.' + extension)
    }
});
const upload = multer({
    storage: storage
}).single('file');
function uploadFile(req, auth, res, callback) {
    const drive = google.drive({ version: 'v3', auth });
    
    let { name: filename, mimetype, data } = req

    var fileMetadata = {
        'name': req.file.filename
      };
      var media = {
        mimeType: 'image/jpeg',
        body: fs.createReadStream('C:/Users/TanTai/Desktop/ss.jpg')
      };
      drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      }, function (err, file) {
        if (err) {
          // Handle error
          console.error(err);
        } else {
          console.log('File Id: ', file.id);
        }
      });

    // let { name: filename, mimetype, data } = req
    
    // drive.files.create({
    //     resource: {
    //         name: filename,
    //         mimeType: mimetype
    //       },
    //       media: {
    //         mimeType: mimetype,
    //         body: Buffer.from(data).toString()
    //       },
    // }, function (err, response) {
    //     if (err) {
    //         // Handle error
    //         callback(err, null);
    //     } else {
    //         console.log('File Id: ', response.data.id);
    //         return res.json({id: response.data.id});
    //     }
    // });    
}
router.post('/upload', /*passport.authenticate('jwt', {session: false}),*/ (req,res) => {
    
    // Load client secrets from a local file.
    upload(req,res,(err) => {
        if(err){
            res.json({
                statusCode: -1,
                message: err
            });
        } else {
            if(req.file == undefined){
                res.json({
                    statusCode: -1,
                    message: err
                });
            } else {
                console.log(req.file.filename)
                fs.readFile('credentials.json', (err, content) => {
                    if (err) return console.log('Error loading client secret file:', err);
                    // Authorize a client with credentials, then call the Google Drive API.
                    authorize(JSON.parse(content), uploadFile(req.file))
                });
            }
        }
    })
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client); //list & upload
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */


function getFile(auth, fileId) {
    const drive = google.drive({ version: 'v3', auth });
    drive.files.get({ fileId: fileId, fields: '*' }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        console.log(res.data); c
    });
}
module.exports = router;