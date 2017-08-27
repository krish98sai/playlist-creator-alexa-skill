var request = require("request");

var topic;
var amount;
var accessToken;

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
  accessToken = event.session.user.accessToken;
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);
        var deviceID = "";

    if (event.session.application.applicationId !== "amzn1.ask.skill.840d029e-fa9a-4b0d-ae19-27aeacd1f86d") {
        context.fail("Invalid Application ID");
    }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(deviceID, event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
}

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
  getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(deviceID, intentRequest, session, callback) {

    var intent = intentRequest.intent;
    var intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here (done)
    if(intentName == "setTopic"){
      handleTopicResponse(deviceID, intent, session, callback);
    } else if (intentName == "setAmount") {
      handleAmountResponse(deviceID, intent, session, callback);
    } else if (intentName == "AMAZON.HelpIntent"){
      handleHelpResponse(deviceID, intent, session, callback);
    } else if (intentName == "AMAZON.CancelIntent"){
      getGoodbyeResponse(callback);
    } else if (intentName == "AMAZON.StopIntent"){
      getGoodbyeResponse(callback);
    } else if (intentName == "startOver") {
      getWelcomeResponse(callback);
    } else {
      throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true. (done)
 */
function onSessionEnded(sessionEndedRequest, session) {}

// ------- Skill specific logic -------
//(done)
function getWelcomeResponse(callback) {
  var speechOutput = "Welcome to YouTube playlist creator. Please tell me what topic you want by saying, find videos about, and a topic.";
  var reprompt = "Please tell me what topic you want by saying, find videos about, and a topic.";
  var header = "YouTube Playlist Creator";
  var shouldEndSession = false;
  var sessionAttributes = {
    "speechOutput" : speechOutput
  };
  callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
}

//(done)
function getGoodbyeResponse(callback) {
  var speechOutput = "OK, goodbye!";
  var reprompt = "Goodbye.";
  var header = "YouTube Playlist Creator";
  var shouldEndSession = true;
  var sessionAttributes = {
    "speechOutput" : speechOutput,
    "repromptText" : reprompt
  };
  callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
}

//(done)
function handleHelpResponse(deviceID, intent, session, callback){
  var speechOutput = "You can start by telling me what topic you want by saying, find videos about, and a topic.";
  var reprompt = "You can start by telling me what topic you want by saying, find videos about, and a topic.";
  var header = "YouTube Playlist Creator";
  var shouldEndSession = false;
  var sessionAttributes = {
    "speechOutput" : speechOutput,
    "repromptText" : reprompt
  };
  callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
}

//(done)
function handleTopicResponse(deviceID, intent, session, callback){
  if(intent.slots.Topic.value){
    topic = intent.slots.Topic.value;
  }
  else{
    getWelcomeResponse(callback);
  }
  var speechOutput = "OK. How many videos about " + topic + "?";
  var reprompt = "How many videos about " + topic + "?";
  var header = "YouTube Playlist Creator";
  var shouldEndSession = false;
  var sessionAttributes = {
    "speechOutput" : speechOutput,
    "repromptText" : reprompt
  }
  callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
}

function handleAmountResponse(deviceID, intent, session, callback){

  var header = "YouTube Playlist Creator";
  var shouldEndSession = true;
  var speechOutput = ""
  var reprompt = speechOutput;
  var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
  }

  if(intent.slots.Amount.value == null){
    getWelcomeResponse(callback);
  }
  if(intent.slots.Amount.value < 1 || intent.slots.Amount.value > 50){
    speechOutput = intent.slots.Amount.value + " is too large or too small. Please choose a number between 1 and 50 inclusive.";
    reprompt = "Just say, create, a number, videos.";
    shouldEndSession = false;
    sessionAttributes = {
          "speechOutput" : speechOutput,
          "repromptText" : reprompt
    }
    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
  }
  if(accessToken == null){
    speechOutput = "Sorry, your YouTube account is not linked. Refer to the Alexa app for more information.";
    reprompt = "Refer to the Alexa app for more information";
    shouldEndSession = true;
    sessionAttributes = {
          "speechOutput" : speechOutput,
          "repromptText" : reprompt
    }
    callback(sessionAttributes, buildAccountLinkSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))
  }
  amount = intent.slots.Amount.value;
  console.log("topic " + topic);
  console.log("amount " + amount);
  console.log("accessToken " + accessToken);

  //Creating new YouTube playlist with topic as name.
  var requestData = {
                      "snippet":
                      {
                        "title": topic,
                        "description": "This is a playlist generated by YouTube Playlist Creator."
                      },
                      "status":
                      {
                        "privacyStatus": "private"
                      }
                    };
  console.log(JSON.stringify(requestData))
  request({
    url: 'https://www.googleapis.com/youtube/v3/playlists?part=snippet%2Cstatus',
    method: "POST",
    json: requestData,
    headers: {
      "Authorization": "Bearer " + accessToken,
      "content-type": "application/json"
    }
}, function(err, httpResponse, body){
  console.log("Err1: " + err + " Response1: " + JSON.stringify(httpResponse) + " Body1: " + body)
  if (httpResponse.statusCode == 200) {
    //Playlist successfully created.
    //Preform search
    var playlistId = httpResponse.body.id
    request({
      url: 'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=' + topic + '&maxResults=' + amount,
      method: "GET",
      headers: {
        "Authorization": "Bearer " + accessToken
      }
    }, function(err, httpResponse, body){
      if(httpResponse.statusCode == 200) {
        var counter = 1;
        //Search successful
        //Insert videos into playlist
        console.log(playlistId)
        console.log("Err2: " + err + " Response2: " + JSON.stringify(httpResponse) + " Body2: " + body)
        var searchResults = JSON.parse(body).items
        insertVideo(searchResults, playlistId, 0, amount, callback);
      }
    })
  }
})
}

function insertVideo(searchResults, playlistId, current, total, callback){
    var requestData2 = {
                        "snippet":
                        {
                          "playlistId":playlistId,
                          "resourceId":
                          {
                            "kind":"youtube#video",
                            "videoId":searchResults[current].id.videoId
                          }
                        }
                       }
    request({
      url: 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
      method: "POST",
      json: requestData2,
      headers: {
        "Authorization": "Bearer " + accessToken,
        "content-type": "application/json"
      }
    }, function(err, httpResponse, body){
      if(httpResponse.statusCode == 200){
        if(current == total-1){
          var header = "YouTube Playlist Creator";
          speechOutput = "Great! I've created a playlist about " + topic + " with " + amount + " videos.";
          reprompt = speechOutput;
          shouldEndSession = true;
          sessionAttributes = {
                "speechOutput" : speechOutput,
                "repromptText" : reprompt
          }
          callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, "", shouldEndSession));
        }
        else{
          insertVideo(searchResults, playlistId, current + 1, total, callback);
        }
      }
    })
}

//(done)
function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
      }

}

//(done)
function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes, buildSpeechletResponseWithoutCard("Good bye!", "", true));
}


// ------- Helper functions to build responses for Alexa -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildAccountLinkSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "LinkAccount",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
  }
