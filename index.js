"use strict";
const logger    = require('./app//modules/logger');
const push = require("./app/modules/database_mod");

var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// Load the SDK
let RainbowSDK = require("rainbow-node-sdk");

// Define your configuration
let options = {
    rainbow: {
        host: "sandbox"
    },
    credentials: {
        login: "joey_yeo@mymail.sutd.edu.sg", // To replace by your developer credendials
        password: "OFLl[8d(Py~8" // To replace by your developer credentials
    },
    // Application identifier
    application: {
        appID: "b6f834105aed11eabf7e77d14e87b936",
        appSecret: "LzUG5l0iM9YproZTONXSkwnRmeAl7cEWrxSyg3ziSHlPpOVGVA8YY5lC2R6B0IwT"
    },

    // Logs options
    logs: {
        enableConsoleLogs: true,
        enableFileLogs: false,
        "color": true,
        "level": 'debug',
        "customLabel": "vincent01",
        "system-dev": {
            "internals": false,
            "http": false,
        }, 
        file: {
            path: "/var/tmp/rainbowsdk/",
            customFileName: "R-SDK-Node-Sample2",
            level: "debug",
            zippedArchive : false/*,
            maxSize : '10m',
            maxFiles : 10 // */
        }
    },
    // IM options
    im: {
        sendReadReceipt: true
    }
};

// Instantiate the SDK
let rainbowSDK = new RainbowSDK(options);

// Start the SDK
rainbowSDK.start().then(() => {
     // Do something when the SDK is connected to Rainbow

     // Set static folders
     // Grant access permission
    app.use('/public', express.static('public'));
    app.use('/static', express.static('static'));
    app.use(bodyParser.urlencoded({
    extended: true
    }));

    // get root html
    app.get('/',function(req,res){
    res.sendfile("./public/index.html");
    });

    // get all other htmls
    /*
    contactUs
    chat
    email
    call
    */
    app.get('/chat.html', function(req, res){
        res.sendfile("./public/chat.html");
    })

    app.get('/contactUs.html', function(req, res){
        res.sendfile("./public/contactUs.html");
    })

    app.get('/email.html', function(req, res){
        res.sendfile("./public/email.html");
    })

    app.get('/call.html', function(req, res){
        res.sendfile("./public/call.html");
    })

    app.post('/guestLogin', async function(req, res){
        console.log("Creation of guest account request received.");

        var guestaccount = await rainbowSDK.admin.createGuestUser(7200).then( (guest) => {
            return guest;
        }).catch((err) => {
            logger.log("debug", "error creating user");
        });
        var loginCred = {"Username": guestaccount.loginEmail, "Password": guestaccount.password};
        
        // returns the credentials for guest user account
        res.end(JSON.stringify(loginCred));
    })

    // Currently we combien guest account creation and usage tgt
    // creates guest user account
    /*
    app.post('/reAccount', async function(req,res){
        var firstName=req.body.firstName;
        var lastName=req.body.lastName;
        var guestaccount;
        console.log("first Name = "+firstName+", last Name = "+lastName);

        var guestaccount = await rainbowSDK.admin.createGuestUser(firstName, lastName, "en-US", 86400).then( (guest) => {
            // Do something when the guest has been created and added to that company
            return guest;
            //logger.log("debug", "guest"+guest);
        }).catch((err) => {
            // Do something in case of error
            logger.log("debug", "error creating user");
        });

        var loginCred = {"loginEmail": guestaccount.loginEmail, "password": guestaccount.password};
        
        // returns the credentials for guest user account
        res.end(JSON.stringify(loginCred));
     });
     */
     
    var server = app.listen(8081, function () {
        var host = server.address().address
        var port = server.address().port
        console.log("Example app listening at http://%s:%s", host, port)
     });
    
    // Routing part
    rainbowSDK.events.on("rainbow_onmessagereceived", async (message) => {
        // Check if the message is not from you
        if(!message.fromJid.includes(rainbowSDK.connectedUser.jid_im)) {
            // Check that the message is from a user and not a bot
            if( message.type === "chat") {
                // Answer to this user
                rainbowSDK.im.sendMessageToJid("hello! Im listening!", message.fromJid);
                push.todb(message.content);
                // Do something with the message sent
                if(message.content == "i want agent"){
                    let withHistory = false; // Allow newcomers to have access to the bubble messages since the creation of the bubble
                    rainbowSDK.bubbles.createBubble("Support", "A little description of my bubble", withHistory).then(async function(bubble) {
                        // do something with the bubble created
                        
                        let invitedAsModerator = false;     // To set to true if you want to invite someone as a moderator
                        let sendAnInvite = false;            // To set to false if you want to add someone to a bubble without having to invite him first
                        let inviteReason = "bot-invite";    // Define a reason for the invite (part of the invite received by the recipient)
                        var contact_id = await rainbowSDK.contacts.getContactByJid(message.fromJid);
                        
                        rainbowSDK.bubbles.inviteContactToBubble(contact_id, bubble, invitedAsModerator, sendAnInvite, inviteReason).then(function(bubbleUpdated) {
                            // do something with the invite sent
                            logger.log("debug", "user has been added to bubble");
                        }).catch(function(err) {
                            // do something if the invitation failed (eg. bad reference to a buble)
                            logger.log("debug", "user invite failed");
                        });
                        
                        var contact_agent = await rainbowSDK.contacts.getContactById("", true);
                        rainbowSDK.bubbles.inviteContactToBubble(contact_agent, bubble, invitedAsModerator, sendAnInvite, inviteReason).then(function(bubbleUpdated) {
                            // do something with the invite sent
                            logger.log("debug", "agent has been added to bubble");
                        }).catch(function(err) {
                            // do something if the invitation failed (eg. bad reference to a buble)
                            logger.log("debug", "agent invite failed");
                        });
                        
                    }).catch(function(err) {
                        // do something if the creation of the bubble failed (eg. providing the same name as an existing bubble)
                        logger.log("debug","bubble creation failed");
                    });
                }
            }
        }
    });
    
});
