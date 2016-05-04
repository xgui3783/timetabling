#!/bin/env node

var http = require('http');

var express = require('express');
var app = require('express')();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var mysql = require('mysql');
var sha256 = require('js-sha256');


/*
var dbname = 'nodejs';
var connection = mysql.createConnection({
	host	:'localhost', 
	user	:'root',
	password	:'',
	database	:dbname
});
*/

/* process.env.OPENSHIFT_MYSQL_DB_HOST, */


var dbname = 'timetable';
var connection = mysql.createConnection({
	host	:'127.7.51.130', 
	user	:'adminsrCNFym',
	password	:'9gPQRXKgSdbH',
	database	:dbname
});


io.on('connection',function(socket){
	
	console.log("an anonymous user has connected");
	
	socket.on('disconnect',function(){
		if(socket.name==undefined){
			console.log('an anonymous user has disconnected.');
		}else{
			console.log(socket.name + ' has disconnected.');
		}
	});
	
	socket.on('login',function(i,callback){
		connection.query('SELECT hashed_id,name, salt, pswd_encrypt, admin FROM tutor_db WHERE email = ?',i.usr,function(e,r){
			if(e){
				socket.emit('server_to_client_update_failed', 'Err530 db failed. Trace: '+e);
			}else{
				if(r.length==0){
					error_log(i);
					var o = {'message':'wrong pswd'}
					callback(o);
					//write to login error log
				}else if (r[0].pswd_encrypt!=sha256(i.pswd+r[0].salt)){
					error_log(i);
					var o = {'message':'wrong pswd'}
					callback(o);
					//write to login error log
				}else{
					console.log(r[0].name + ',with admin power of ' + r[0].admin + ' has logged in.');
					var o = {
						'message'	:'login ok',
						'name'		:r[0].name,
						'admin'		:r[0].admin,
						'hashed_id'	:r[0].hashed_id}
					socket.name = r[0].name;
					socket.admin = r[0].admin;
					socket.hashed_id = r[0].hashed_id;
					callback(o);
				}
			}
		})
	});
	
	
	socket.on('add_new_tutor',function(i,callback){
		var hashed_id = i.now;
		var salt = sha256(i.name+i.now);
		connection.query('INSERT INTO tutor_db (name,mobileno,email,hashed_id,salt) VALUES (?,?,?,?,?);',[i.name,i.mobileno,i.email,hashed_id,salt],function(e){
			if(e){
				socket.emit('server_to_client_update_failed', 'Err29 db failed. Likely due to database is down. Trace:'+e);		
			}else{
				connection.query('UPDATE tutor_db SET pswd_encrypt = ? WHERE hashed_id = ?',[sha256(i.newpswd+salt),hashed_id],function(e2){
					if(e2){
						socket.emit('server_to_client_update_failed', 'Err35 db failed. Likely due to database is down. Trace:'+e2);		
					}else{
						io.emit('append_tutor_slot',i.name);
						callback('add_new_tutor_complete');
					}
				});
			}
		})
	});
	
	socket.on('update_existing_tutor',function(i,callback){
		var update_json = {
			'name':i.name,
			'email':i.email,
			'mobileno':i.mobileno};
		if(socket.admin==2){
			update_json['admin']=i.admin;
		}
		if((i.oldpswd!=undefined&&(socket.admin==0||socket.admin==1))||(socket.admin==2)&&i.newpswd!=undefined){
			/* updating pswd as well as basic info */
			connection.query('SELECT salt, pswd_encrypt FROM tutor_db WHERE hashed_id = ?',i.hashed_id,function(e,r){
				if(e){
					socket.emit('server_to_client_update_failed', 'Err50 db failed. Likely due to database is down. Trace:'+e);
				}else{
					if((sha256(i.oldpswd+r[0].salt)==r[0].pswd_encrypt)||socket.admin==2){
						//right old pswd or person has admin rights of 2
						update_json['pswd_encrypt']=sha256(i.newpswd+r[0].salt);
						connection.query('SELECT * FROM tutor_db WHERE email = ? AND NOT hashed_id = ?',[i.email,i.hashed_id],function(e2,r2){
							if(e2){
								socket.emit('server_to_client_update_failed', 'Err55 db failed. Likely due to database is down. Trace:'+e2);
							}else if(r2.length>0){
								callback('same_email');
							}else{
								connection.query('UPDATE tutor_db SET ? WHERE hashed_id = ?',[update_json,i.hashed_id],function(e3,r3){
									if(e3){
										socket.emit('server_to_client_update_failed', 'Err57 db failed. Likely due to database is down. Trace:'+e);
									}else{
										callback('update_completed');
									}
								})
							}
						})
						
					}else{
						//wrong old pswd
						callback('wrong_old_pswd');
					}
				}
			})
		}else{
			connection.query('SELECT * FROM tutor_db WHERE email = ? AND NOT hashed_id = ?',[i.email,i.hashed_id],function(e2,r2){
				if(e2){
					socket.emit('server_to_client_update_failed', 'Err55 db failed. Likely due to database is down. Trace:'+e2);
				}else if(r2.length>0){
					callback('same_email');
				}else{
					connection.query('UPDATE tutor_db SET ? WHERE hashed_id = ?',[update_json,i.hashed_id],function(e3,r3){
						if(e3){
							socket.emit('server_to_client_update_failed', 'Err57 db failed. Likely due to database is down. Trace:'+e);
						}else{
							callback('update_completed');
						}
					})
				}
			})
			/* just updating the basic info */
		}
	});
	
	socket.on('load_profiles',function(i,callback){
		connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "' + dbname + '" AND TABLE_NAME = "tutor_db"',function(e,rows){
			if(e){
				socket.emit('server_to_client_update_failed', 'Err29 db failed. Likely due to database is down. Trace:'+e);
			}else{
				if(rows.length==0){
					connection.query(
					'CREATE TABLE tutor_db ('+
					'id int(4) NOT NULL AUTO_INCREMENT,'+
					'hashed_id varchar(64) NOT NULL,'+
					'admin int(1) NOT NULL,'+
					
					'name varchar(64) NOT NULL,'+
					'mobileno varchar(16) NOT NULL,'+
					'email varchar(128) NOT NULL,'+
					
					'salt varchar(64) NOT NULL,'+
					'pswd_encrypt varchar(64) NOT NULL,'+
					'login_token varchar(64) NOT NULL,'+
					
					'PRIMARY KEY(id));',
					function(e){
						if(e){
							socket.emit('server_to_client_update_failed', 'Err53 db failed. Likely due to database is down. Trace:'+e);		
						}
						
						/* append add tutor button? */
						socket.emit('append_add_new_tutor_button');
						
					});
				}else{
					connection.query('SELECT hashed_id, name, mobileno, email FROM tutor_db',function(e,rows){
						if(e){
							socket.emit('server_to_client_update_failed', 'Err58 db failed. Likely due to database is down. Trace:'+e);		
						}else{
							for (i=0;i<rows.length;i++){
								socket.emit('send_profile',rows[i]);
							}
							socket.emit('append_add_new_tutor_button');
						}
					})
				}
			}
		})
	});
	
	socket.on('on_document_load',function(callback){
		/* on document load */
		
		connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "' + dbname + '" AND TABLE_NAME = "tutor_db"',function(e,rows){
			if(e){
				socket.emit('server_to_client_update_failed', 'Err29 db failed. Likely due to database is down. Trace:'+e);
			}else{
				if(rows.length==0){
					connection.query(
						'CREATE TABLE tutor_db ('+
						'id int(4) NOT NULL AUTO_INCREMENT,'+
						'hashed_id varchar(64) NOT NULL,'+
						'admin int(1) NOT NULL,'+
						
						'name varchar(64) NOT NULL,'+
						'mobileno varchar(16) NOT NULL,'+
						'email varchar(128) NOT NULL,'+
						
						'salt varchar(64) NOT NULL,'+
						'pswd_encrypt varchar(64) NOT NULL,'+
						'login_token varchar(64) NOT NULL,'+
						
						'PRIMARY KEY(id));',
					function(e){
						if(e){
							socket.emit('server_to_client_update_failed', 'Err172 db failed. Likely due to database is down. Trace:'+e);		
						}
					});
				}else{
					var o = {
						'admin'	:socket.admin,
						'name'	:socket.name};
					callback(o);	
					connection.query('SELECT name FROM tutor_db',function(e,r){
						if(e){
							socket.emit('server_to_client_update_failed', 'Err151 db failed. Likely due to database is down. Trace:'+e);
						}else{
							for (j=0;j<r.length;j++){
								socket.emit('append_tutor_slot',r[j].name);
							}
						}
					});
				}
			}
		});
		
		connection.query('SELECT TABLE_NAME, CREATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+dbname+'" AND TABLE_NAME LIKE "tt_%" ORDER BY CREATE_TIME DESC',function(e,rows){
			if (rows.length==0){
				/* if there are no tables start with tt_, then create a table called tt_Untitled */
				connection.query(
					'CREATE TABLE tt_Untitled (id int(4) NOT NULL AUTO_INCREMENT,'+
					 'hashed_id varchar(64) NOT NULL,'+
					 'classname varchar(64) NOT NULL,'+
					 'tutorname varchar(64) NOT NULL,'+
					 'location varchar(64) NOT NULL,'+
					 'day varchar(3) NOT NULL,'+
					 'starttime varchar(5) NOT NULL,'+
					 'endtime varchar(5) NOT NULL,'+
					 'students varchar(128) NOT NULL,'+
					 'notes varchar(128) NOT NULL,'+
					 'PRIMARY KEY (id));'
					 ,function(e){
					if(e){
						socket.emit('server_to_client_update_failed', 'Err46 db failed. Likely due to database is down. Trace:'+e);
						//throw e;
					}else{
						var jsonO = {};
						jsonO['oldchannel']='';
						jsonO['newchannel']='tt_Untitled';
						load_tt(socket,jsonO);	
					}
				});
			}else{			
				var jsonO = {};
				jsonO['oldchannel']='';
				jsonO['newchannel']=rows[0].TABLE_NAME;
				load_tt(socket,jsonO);		
			}
		});
	});
	
	socket.on('save_new_block', function(i){
		if(check_listener(socket,i.timetablename)){
			var tt_name = i.timetablename;
			delete i.timetablename;
			connection.query('INSERT INTO ?? SET ?',[tt_name,i],function(err){
				if (err){
					socket.emit('server_to_client_update_failed', err);
				}else{
					connection.query('SELECT * FROM ?? WHERE hashed_id = ?;',[tt_name,i.hashed_id],function(err,j){
						if(err){				
							socket.emit('server_to_client_update_failed', 'Err44. Select failed. Likely due to database is down. Trace:'+e);
							//throw err;
						}else{
							io.to(tt_name).emit('server_to_all_update_block',j[0]);
						}
					})
				}
			});
		}else{
			socket.emit('server_to_client_update_failed', 'Err058, client not listening correctly. Usually a refresh will help solve the problem');
		}
	});
	socket.on('save_existing_block',function(i){
		if(check_listener(socket,i.timetablename)){
			var tt_name=i.timetablename;
			delete i.timetablename;
			connection.query('UPDATE ?? SET ? WHERE hashed_id = ?',[tt_name,i,i.hashed_id],function(err,result){
				if(err){
					console.log(err);
					return;
				}
				io.to(tt_name).emit('server_to_all_update_block',i);
			})
		}else{
			socket.emit('server_to_client_update_failed', 'Err073, client not listening correctly. Usually a refresh will help solve the problem');
		}
	});
	socket.on('delete_existing_block',function(i){
		if(check_listener(socket,i.timetablename)){
			connection.query('DELETE FROM ?? WHERE hashed_id = ?',[i.timetablename,i.hashed_id],function(err){
				io.to(i.timetablename).emit('server_to_all_remove_block',i.hashed_id);
			});
		}else{
			socket.emit('server_to_client_update_failed', 'Err080, client not listening correctly. Usually a refresh will help solve the problem');
		}
	});
	socket.on('edit_tutor',function(i,callback){
		if(socket.admin==2){
			var q = 'SELECT admin,hashed_id, name, mobileno, email FROM tutor_db WHERE hashed_id = ?';
		}else if (socket.admin==1||socket.admin==0){
			var q = 'SELECT hashed_id, name, mobileno, email FROM tutor_db WHERE hashed_id = ?';
		}
		connection.query(q,i,function(e,r){
			if(e){
				socket.emit('server_to_client_update_failed', 'Err159. Select failed. Likely due to database is down. Trace:'+e);
			}else{
				if(r.length>0){
					callback(r);
				}else{
					socket.emit('server_to_client_update_failed', 'Tutor does not exist');
				}
			}
		})
		//i is hashed id of the tutor to be edited
	});
	socket.on('delete_tutor',function(i,callback){
		//i = hashed_id of the tutor to be deleted
		connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "' + dbname + '" AND TABLE_NAME = "del_tutor_db"',function(e,rows){
			if(e){
				socket.emit('server_to_client_update_failed', 'Err288 db failed. Likely due to database is down. Trace:'+e);
			}else{
				if(rows.length==0){
					connection.query(
					'CREATE TABLE del_tutor_db ('+
					'name varchar(64) NOT NULL,'+
					'mobileno varchar(16) NOT NULL,'+
					'email varchar(128) NOT NULL)',
					function(e1){
						if(e1){
							socket.emit('server_to_client_update_failed', 'Err288 db failed. Likely due to database is down. Trace:'+e1);
						}else{
							connection.query('INSERT INTO del_tutor_db SELECT name, email, mobileno FROM tutor_db WHERE hashed_id=?',i,function(e2){
								if(e){
									socket.emit('server_to_client_update_failed', 'Err196. Delete failed. Likely due to database is down. Trace:'+e2);
								}else{
									connection.query('DELETE FROM tutor_db WHERE hashed_id = ?',i,function(e3){
									if(e){
										socket.emit('server_to_client_update_failed', 'Err200. Delete failed. Likely due to database is down. Trace:'+e3);
									}else{
										var o = {
											'hashed_id'	:i,
											'message'	:'tutor_record_deleted'}
										callback(o);
									}
									});
								}
							});
						}
					})
				}else{				
					connection.query('INSERT INTO del_tutor_db SELECT name, email, mobileno FROM tutor_db WHERE hashed_id=?',i,function(e2){
						if(e){
							socket.emit('server_to_client_update_failed', 'Err196. Delete failed. Likely due to database is down. Trace:'+e2);
						}else{
							connection.query('DELETE FROM tutor_db WHERE hashed_id = ?',i,function(e3){
							if(e){
								socket.emit('server_to_client_update_failed', 'Err200. Delete failed. Likely due to database is down. Trace:'+e3);
							}else{
								var o = {
									'hashed_id'	:i,
									'message'	:'tutor_record_deleted'}
								callback(o);
							}
							});
						}
					});
				}
			}
		});
	});
	socket.on('tt_load',function(callback){
		connection.query('SELECT TABLE_NAME, CREATE_TIME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+dbname+'" AND TABLE_NAME LIKE "tt_%" ORDER BY CREATE_TIME DESC',function(e,rows){
			if(e){
				socket.emit('server_to_client_update_failed', 'Err105 deletion failed. Likely due to database is down. Trace:'+e);
				//throw e;
			}
			var jsonObj = {};
			for (i=0;i<rows.length;i++){
				if(rows[i].TABLE_NAME.substring(0,3)=='tt_'){
					jsonObj[i] = [rows[i].TABLE_NAME.substring(3),rows[i].CREATE_TIME];
				}
			}
			callback(jsonObj);
		});	
	});
	
	socket.on('tt_manipulation',function(i,callback){
		var passedname = i.target;
		var passedmode = i.mode;
		var passednewname = i.newname;
		connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "'+dbname+'"',function(e,r){
			if(e){
				socket.emit('server_to_client_update_failed', 'Err125 deletion failed. Likely due to database is down. Trace:'+e);
				//throw e;
			}else{
				switch(passedmode){
					
					case 'delete':
						var newname = 'del_'+passedname+'_1';
						do{
							var unique = true;
							for (j=0;j<r.length;j++){
								if(newname == r[j].TABLE_NAME)
								{
								unique = false; 
								newname = 'del_'+passedname+'_'+(Number(newname.substring(passedname.length+5))+1).toString();
								}
							}
						}while(!unique)
						connection.query('RENAME TABLE ?? TO ??',[passedname, newname],function(e){
							if(e){
								socket.emit('server_to_client_update_failed', 'Err111 deletion failed. Likely due to database is down. Trace:'+e);
								//throw e;
							}else{
								callback('tt_delete_done');
								socket.broadcast.to(passedname).emit('server_to_all_tt_deleted');
								/* force all sockets in this room to leave */
							}
						});
					break;
					
					case 'ren':
						var unique = true;
						for (j=0;j<r.length;j++){
							if(passednewname == r[j].TABLE_NAME)
							{
							unique = false; 
							}
						}
						if(unique){
							connection.query('RENAME TABLE ?? TO ??', [passedname,passednewname],function(e){
								if(e){
									socket.emit('server_to_client_update_failed', 'Err167 deletion failed. Likely due to database is down. Trace:'+e);
									//throw e;
								}else{
									callback('rename_done');
								}
							})
						}else{
							callback('not_unique');							
						}
					break;
					
					case 'new':
						var unique = true;
						for (j=0;j<r.length;j++){
							if(passednewname == r[j].TABLE_NAME)
							{
							unique = false; 
							}
						}
						if(unique){
							connection.query(
								'CREATE TABLE ?? (id int(4) NOT NULL AUTO_INCREMENT,'+
								 'hashed_id varchar(64) NOT NULL,'+
								 'classname varchar(64) NOT NULL,'+
								 'tutorname varchar(64) NOT NULL,'+
								 'location varchar(64) NOT NULL,'+
								 'day varchar(3) NOT NULL,'+
								 'starttime varchar(5) NOT NULL,'+
								 'endtime varchar(5) NOT NULL,'+
								 'students varchar(128) NOT NULL,'+
								 'notes varchar(128) NOT NULL,'+
								 'PRIMARY KEY (id));'
								 ,passednewname,function(e){
								if(e){
									socket.emit('server_to_client_update_failed', 'Err206 deletion failed. Likely due to database is down. Trace:'+e);
									//throw e;
								}else{
									callback('createnew_done');
								}
							});
						}else{
							callback('not_unique');
						}
					break;
					
					case 'sav':
						var unique = true;
						for (j=0;j<r.length;j++){
							if(passednewname == r[j].TABLE_NAME)
							{
							unique = false; 
							}
						}
						if(unique){
							connection.query(
								'CREATE TABLE ?? (id int(4) NOT NULL AUTO_INCREMENT,'+
								 'hashed_id varchar(64) NOT NULL,'+
								 'classname varchar(64) NOT NULL,'+
								 'tutorname varchar(64) NOT NULL,'+
								 'location varchar(64) NOT NULL,'+
								 'day varchar(3) NOT NULL,'+
								 'starttime varchar(5) NOT NULL,'+
								 'endtime varchar(5) NOT NULL,'+
								 'students varchar(128) NOT NULL,'+
								 'notes varchar(128) NOT NULL,'+
								 'PRIMARY KEY (id));'
								 ,passednewname,function(e){
								if(e){
									socket.emit('server_to_client_update_failed', 'Err206 deletion failed. Likely due to database is down. Trace:'+e);
									//throw e;
								}else{
									connection.query('INSERT INTO ?? SELECT * FROM ??',[passednewname,passedname],function(e){
										if(e){
											socket.emit('server_to_client_update_failed', 'Err211 deletion failed. Likely due to database is down. Trace:'+e);
											//throw e;
										}else{
											callback('saveas_done');
										}
									});
								}
							});
						}else{
							callback('not_unique');
						}
					break;
					default:
				}
			}
		});
	}); 
	
	socket.on('tt_load_tt',function(i){
		load_tt(socket,i);
	});
});

function load_tt(socket,i){
	connection.query('SELECT * FROM ??',i.newchannel,function(e,rows){
		if(e){
			//throw e;
			socket.emit('server_to_client_update_failed', 'Err140 loading timetable failed. Trace: '+e);
		}else{
			socket.emit('clearblocks');
			for (var j = 0; j<rows.length; j++){				
				if(socket.admin==1||socket.admin==2){
					socket.emit('add_lesson_block',rows[j]);
				}else{
					
					if(rows[j].tutorname==socket.name){
						socket.emit('add_lesson_block',rows[j]);
					}
				}
			}
			socket.emit('server_to_client_tablename',i.newchannel);
			
			/* a little bit concerned that rearrange blocks will be fired before all the blocks are added in some circumestances */
			socket.emit('server_to_client_rearrange_blocks');
			socket.leave(i.oldchannel);
			socket.join(i.newchannel);
		}
	});
}

function error_log(i){
	connection.query('SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = "' + dbname + '" AND TABLE_NAME = "login_error_log"',function(e,row){
		if(e){
			console.log('e:'+e);
		}else{
			if(row.length==0){
				//create table called login_error_log (date,login name,pswd (sha256'd))
				connection.query('CREATE TABLE login_error_log (time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, name VARCHAR(128),sha256_pswd VARCHAR(64));',function(e1){
					if(e1){
						console.log('e1:'+e1);
					}else(
						connection.query('INSERT INTO login_error_log (name, sha256_pswd) VALUES (?,?)',[i.usr,i.pswd],function(e2){
							if(e2){
								console.log('e2'+e2);
							}
						})
					)
				})
			}else{
				connection.query('INSERT INTO login_error_log (name, sha256_pswd) VALUES (?,?)',[i.usr,i.pswd],function(e1){
					if(e1){
						console.log('e3:'+e1)
					}
				})
			}
		}
	});
}

function check_listener(socket,timetablename){
	/* check if the socket had connected to the particular timetable */
	if(socket.rooms[timetablename]!=undefined){
		return true;
	}else{
		return false;
	}
}

app.use(express.static('public'));

app.get('/', function (req,res){
	res.sendfile('tt.html');
});


app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

server.listen(app.get('port'),app.get('ip'));

//server.listen(3000);