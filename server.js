"use strict";

// Node modules
var restify = require('restify');
var builder = require('botbuilder');

// Application vars
var startIntentRegEx = /play\s+high\s+low/i
var endIntentRegEx = /end\s+game/i

// endpoints
var bot = new builder.BotConnectorBot({appId: 'highlowchatbot', appSecret: 'e417a887dc7143fa91f4469eb2177223'});
bot.add('/', function(session) {

	var text = session.message.text;

	if (startIntentRegEx.test(text))
		session.beginDialog('/max-num')
	else
		session.sendMessage(null)
});
bot.add('/max-num', [
	function (session) {
		builder.Prompts.number(session, "What's the max number?")
	},
	function (session, results) {
		var max = results.response;
		if (max == -1)
			session.endDialog("Game ended")

		session.userData.max = max;
		session.userData.num = Math.ceil(Math.random() * max)
		session.userData.round = 1;
		session.userData.diff = 0;
		session.replaceDialog('/round');
	}
]);
bot.add('/round', [
	function (session) {
		var msg = "Guess a number.";
		if (session.userData.diff > 0)
			msg = "Your guess was too high! Guess again."
		else if (session.userData.diff < 0)
			msg = "Your guess was too low! Guess again."

		builder.Prompts.number(session, msg)
	},
	function (session, results) {
		// function vars
		var round = session.userData.round;
		var target = session.userData.num;
		var guess = results.response;

		if (guess == -1)
			session.endDialog("Game ended")
		
		// high/low logic
		if (guess === target) { // Winning Case
			session.endDialog("Wow you got it in " + round + (round === 1 ? " round" : " rounds"));
		} else { // Losing case
			session.userData.diff = guess - target;
			session.userData.round++;	

			session.replaceDialog("/round");
		}
	}
])

// run server
var server = restify.createServer();
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(process.env.port || 3978, function() {
	console.log('%s listening to %s', server.name, server.url);
});