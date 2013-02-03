var express = require('express');
var app = express.createServer();
var util = require('util')
var exec = require('child_process').exec;

var assert = require('assert');
var vmcjs = require('vmcjs');

var target = (process.env.CF_TARGET);
var user = (process.env.CF_USER);
var pwd = (process.env.CF_PWD);
var whitelist = (process.env.CF_WHITELIST);
var GITHUBIP = '207.97.227.253, 50.57.128.197, 108.171.174.178, 50.57.231.61.';
var fs = require('fs');

function puts(error, stdout, stderr) { util.puts(stdout) }

app.configure(function(){
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});


app.post('/pusher', function(req, res){
    console.log('post received');
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    ip = ip.split(',')[0].trim(); // it's possible to get multiple ip if using multiple reverse proxy
    if(GITHUBIP.indexOf(ip)==-1){
      console(ip+'rejected');
      return res.send('Not authorized to push. '+ip);
    }
    try {
	p = req.body.payload;

	console.log(p);

	obj = JSON.parse(p);
	obj.repository.url = obj.repository.url.replace("https", "git") + ".git"
	console.log(obj.repository.url + " " + obj.repository.name);

	console.log(obj.pusher.email + " vs. " + user);

        if (obj.pusher.email != user) {	
	    if (typeof whitelist == 'undefined') {
		// exit here
		console.log(obj.pusher.email + " doesn't match " + user + ". not authorized to push");
		res.send('Not authorized to push.');	
		return;
	    } else {
		if (whitelist.indexOf(obj.pusher.email) == -1) {
		    console.log(obj.pusher.email + " not in whitelist: " + whitelist + ". not authorized to push");
		    res.send('Not authorized to push.');	
		    return;
		} else {
		    console.log(obj.pusher.email + " in whitelist: " + whitelist + ". valid to push");
		}
	    }
	} else {
		console.log(obj.pusher.email + " matches " + user + ". valid to push");
	}

	

	var cmd = "cd fixtures; ls; chmod +x git; rm -rf " + obj.repository.name + "; ./git clone " + obj.repository.url +"; ls; cd ..";

	console.log(cmd);

	var child = exec(cmd, function(err, stdout, stderr) {
		//console.log(stdout);
		//console.log(stderr);
		if (err) throw err;
		else {
		    console.log('successful clone');
		    vmcPush(obj.repository.name)
		} 
	    });


    } catch (err) {
	console.log("Error:", err);
    }

    res.send('Done with post');	
});


app.get('/pusher', function(req, res){
    console.log('get received');
    // console.log(req);
    res.send('Done with get'); 
});

app.get('/', function(req, res) {
	res.send('Hello from Cloud Foundry');
    });


app.listen(process.env.VCAP_APP_PORT || 3000);




function vmcPush(appName) {

    console.log('trying the push: ' + appName);
    var vmc = new vmcjs.VMC(target, user, pwd);
    console.log('kicked off the login');

    vmc.login(function(err) {
       console.log('successful login');	    
       assert.equal(err, undefined, "Unexpected err in login: " + util.inspect(err));
       var appDir = './fixtures/' + appName;


    // delete our test app if already exists (purposely ignore any errors)
    vmc.deleteApp(appName, function(err, data){
        vmc.push(appName, appDir, function(err) {
            assert.equal(err, undefined, "Unexpected err in push: " + util.inspect(err));
	    vmc.start(appName, function(err, data){
		    vmc.apps(function(err, apps) {
			    console.log("done successfully starting app");
			});
		});
            });
        });
    });

}
