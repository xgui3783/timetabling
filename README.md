## Timetabling

## Introduction

Timetabling was originally created to help a small team of tutors to more efficiently manage the limited number of rooms and limited amount of time. It can be adapted by small teams whose memebers have regular schedules, and those schedules can change on the fly. 

## Usage

Drag and drop to create timeblocks. Drag and drop to move/resize timeblocks. Single click to edit/delete existing timeblocks. 

Three levels of admin rights. Top level admins can create users, change their admin rights, change their passwords without entering old passwords. Mid level admin can see/create timetable blocks for other users. Low level admin can only see/create timetable block for themselves. 

Filter functionality for Top levels admins. 

Session ends when browser is closed (desktop) or broswer loses focus (mobile). Session can also be ended by reloading or manually logging out (which triggers a reload).

Responsive mobile layout and functionality. 

First time logging in, the application will create the db_tables needed automatically. 

Working example at: <http://timetable-pandamakes.rhcloud.com>

## Deployment

Requires node.js (v 0.10), mysql to function. Deploy it either via:

1a) git clone/ git remote add 

Or

1b) download and copy of */server.js*, */tt.html*, */public/includes/* into the root directory of your node.js application, and install the dependencies separately. 
(dependencies: express, socket.io, mysql, js-sha256)

And

2) Configure MySQL username/pswd/host/dbname accordingly (existing codes should work for openshift mysql catridge)

And

3) Configure the server.listen(port,ip) accordingly (existing codes works for OpenShift Node.js applications)

And

4) Configure var socket = io.connect('http://yourapp.yourdomain.rhcloud.com:8000',function(){}) accordingly (existing codes works for OpenShift Node.js applications)

## Future update

Possibility of letting clients login to see their appointments. 

## Bug reports

Known issue: filter functionality is very slow on mobile devices. 
Known issue: logoff fires randomly. Does not seem to be able to reproduce this bug reliably.

## Contributors

@xgui3783, coffee

## License

MIT