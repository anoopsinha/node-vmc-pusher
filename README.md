Node VMC Pusher: A Github Service Hook for Cloudfoundry
=========================================================


Introduction
------------

4/22/12

This is a github service hook application that works with cloudfoundry.

It can be deployed as an application on cloudfoundry.com, and then
that application can be listed as a service hook for a repository on
github.com.  Then upon pushing to github, the service hook will be
called and the application automatically deployed to cloudfoundry.com.


Instructions
------------

The basic instructions involve setting up the application on
cloudfoundry.com, setting CF authentication variables to the
application, then adding the servicehook to your github application.


#### Step 1. Push the application into your cloudfoundry environment. 

     vmc push node-vmc-pusher

You will need to pick your own a unique name for the service hook.

#### Step 2. Set the environment variables on the application so that it can login to your cloudfoundry account.  

     vmc env-add node-vmc-pusher CF_TARGET=http://api.cloudfoundry.com
     vmc env-add node-vmc-pusher CF_USER=<username>
     vmc env-add node-vmc-pusher CF_PWD=<password>

#### Authorization: the code checks that the github pusher email address is the same as the cloudfoundry user specified.  Optionally you can whitelist other addresses to use the pusher.

     vmc env-add node-vmc-pusher CF_WHITELIST=<emailaddress>,<emailaddress>

In a future version of cloudfoundry, this mechanism will need to be re-written to use CF's oauth functionality.

#### Step 3. Set the github service hook for your repository to this url.

     Repository -> Admin -> Service Hooks -> PostReceive URLs
     http://node-vmc-pusher.cloudfoundry.com/pusher


#### Step 4.  You are ready to go.  

     git push <repository>
     vmc apps

This will take the repository name as the application name and push that to cloudfoundry.com when pushed.


Notes
-----

As of today, this service hook requires all assets (i.e., packages) to
be part of the checked in repository. It is possible to modify this
servicehook to try to stage packages into the repository as well
during the execution of the hook, but because the package managers are
not installed on cloudfoundry.com, this will require running the
application on a self hosted server.

The fixtures needs a binary copy of git and a .fixtures/tmp/ directory
for the application to properly function.  In particular, git = Ubunto
10.04 LTS version compatible.  And there is no compatible system tmp
directory in cloud foundry, so the tmp directory needs to be stored
locally.  Do not move or rename these files.


