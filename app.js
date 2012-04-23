var express = require('express');
var app = express.createServer();
var util = require('util')
var exec = require('child_process').exec;

var assert = require('assert');
var vmcjs = require('vmcjs');

var target = (process.env.CF_TARGET);
var user = (process.env.CF_USER);
var pwd = (process.env.CF_PWD);

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
    try {
	p = req.body.payload;
	obj = JSON.parse(p);
	obj.repository.url = obj.repository.url.replace("https", "git") + ".git"
	console.log(obj.repository.url + " " + obj.repository.name);

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
    console.log(req);
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
