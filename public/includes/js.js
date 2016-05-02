var socket = io('http://timetable-gened.rhcloud.com:8000/',function(){
	
});

$(document).ready(function(){
	
	$('#modal_warning')
	.on('shown.bs.modal',function(){
		$('#modal_warning .btn-default').focus();
	});
	
	$('#nav_login').click(function(){
		$('#modal_login').modal('show');
		$('#modal_login input').val('');
	});
	
	$('#modal_login input')
	.tooltip({
		trigger:	'manual'
	})
	.on('blur',function(){
		if($(this).val()==''){
			$(this).parent().parent().addClass('has-error');
			$(this).tooltip('show');
		}else{
			$(this).parent().parent().removeClass('has-error');
			$(this).tooltip('hide');
			
		}
	});
	
	$('#modal_login')
	.modal('show')
	.on('shown.bs.modal',function(){
		$('#modal_login #id_login_email').focus();
		$('#modal_login').off('keypress').on('keypress',function(i){
			if(i.which==13){
				$('#modal_login .btn-success').click();
			}
		});
		$('#modal_login .btn-success').off().click(function(){
			/* clicking the success button */
			if($('#id_login_email').val().replace(/ /g,'')==''){
				$('#id_login_email').blur();
				$('#id_login_email').select();
				return false;
			}else{
				if($('#id_login_pswd').val()==''){
					$('#id_login_pswd').blur();
					$('#id_login_pswd').select();
					return false;
				}else{
					var json = {
						'usr'	:$('#modal_login #id_login_email').val(),
						'pswd'	:$.sha256($('#modal_login #id_login_pswd').val())
						}
					socket.emit('login',json,function(o){
						if(o.message=='login ok'){
							/* login ok */
							$('#modal_login').modal('hide')
							$('#nav_login')
							.off('click')
							.html('Logout')
							.click(function(){
								location.reload();
							});
							
							switch(o.admin){
								case 0:
									$('#id_tutormodal_hashed_id').val(o.hashed_id);
									tutor_lvl0_binding();							
								break;
								case 1:
									$('#id_tutormodal_hashed_id').val(o.hashed_id);
									tutor_lvl1_binding();
								break;
								case 2:
									tutor_lvl2_binding();
								break;
								default:
								break;
							}
						}else if (o.message =='wrong pswd'){
							$('#modal_warning .modal-title').html('Warning');
							$('#modal_warning .modal-body').html('Incorrect user email or password!');
							$('#modal_warning').modal('show');
						}
					});
				}
			}
		});
	})
	.on('hidden.bs.modal',function(){
		$('#modal_login .modal-body div div').removeClass('has-error');
		$('#modal_login input').tooltip('hide');
	});
	
	$('#modal_edit_tutor')
	.on('shown.bs.modal',function(){
		$('#modal_edit_tutor .btn-success').off('click').click(function(){
			var json = {
				'hashed_id':$('#id_tutormodal_hashed_id').val(),
				'name':$('#id_tutormodal_name').val(),
				'mobileno':$('#id_tutormodal_mobile').val(),
				'email':$('#id_tutormodal_email').val()};
				
			switch($('#modal_edit_tutor .modal-header h4').html().substring(0,3)){
				case 'Upd':
					if($('#pswd_block').hasClass('in')){
						$('#pswd_block input').each(function(){
							$(this).focus().blur();
						})
						if($('#pswd_block').children('div').hasClass('has-error')){
							return false;
						}
						json['oldpswd']=$.sha256($('#id_tutormodal_oldpswd').val());
						json['newpswd']=$.sha256($('#id_tutormodal_newpswd').val());
					}
					socket.emit('update_existing_tutor',json,function(o){
						switch(o){
							case 'wrong_old_pswd':
								$('#id_tutormodal_oldpswd')
								.tooltip({
									title: 'Incorrect password.'
								})
								.tooltip('show')
								.parent().parent().addClass('has-error')
								.keypress(function(){
									$(this).tooltip('hide');
									$(this).parent().parent().removeClass('has-error');
									$(this).off('keypress');
								})
							break;
							case 'same_email':
								$('#id_tutormodal_email').tooltip('show');
								$('#id_tutormodal_email').parent().parent().addClass('has-error');
							break;
							case 'update_completed':
								
								$('#modal_tutor_row #'+json.hashed_id+' div:nth-child(1)').html(json.name);
								$('#modal_tutor_row #'+json.hashed_id+' div:nth-child(2)').html(json.mobileno);
								$('#modal_tutor_row #'+json.hashed_id+' div:nth-child(3)').html(json.email);
								
								$('#modal_edit_tutor').modal('hide');
								
								$('#modal_warning .modal-title').html('Notice');
								$('#modal_warning .modal-body').html('Existing tutor updated.');
								$('#modal_warning').modal('show');
								
							break;
							default:
								//shouldn't be anything here
							break;
						}
					});
				break;
				case 'Add':
					json['now']=$.sha256(Date.now());
					json['newpswd']=$.sha256($('#id_tutormodal_newpswd').val());
					socket.emit('add_new_tutor',json,function(o){
						if(o=='add_new_tutor_complete'){
							$('#modal_edit_tutor').modal('hide');
							json['hashed_id']=json['now'];
							append_tutor_entry(json);
							$('#modal_tutor #id_addnewtutor').insertAfter($('#modal_tutor .modal_tutor_unit').last());
							
							$('#modal_warning .modal-title').html('Notice');
							$('#modal_warning .modal-body').html('New tutor Added.');
							$('#modal_warning').modal('show');
						}
					});
				break;
				default:
				
				break;
			}
		});
		
		$('#id_tutormodal_name').select();
		$('#modal_edit_tutor').keypress(function(i){
			if(i.which==13){
				$('#modal_edit_tutor .btn-success').click();
			}
		})
	})
	.on('hidden.bs.modal',function(){
		$('#modal_edit_tutor .btn-success').off('click');
		$('#modal_edit_tutor').off('keypress');
	});
});


function tutor_lvl2_binding(){
	
	/* show buttons */
	$('#nav_students').css('display','block');
	$('#popup_addtutor').css('display','block');
	
	/* bind functions */
	tutor_lvl1_binding();
	
	/* bind add new tutor button at add class block */
	$('#popup_addtutor').click(function(){
		$('#id_tutormodal_oldpswd').prop('disabled',true);
		$('#pswd_block').removeClass('collapse');
		$('#pswd_block').css('height','153px');
		$('#modal_edit_tutor input').val('');
		$('#modal_edit_tutor').modal('show');
		$('#modal_edit_tutor .modal-title').html('Adding a new tutor');
		$('#modal_edit_tutor h4').last().html('Password');
	});
	
	/* bind tutors profile button */
	$('#nav_profiles').off('click').click(function(){
		$('#modal_tutor').modal('show');
		$('#modal_tutor_row').empty();
		socket.emit('load_profiles','me',function(json){
		})
	});
	
	
	socket.on('append_add_new_tutor_button',function(){
		$('#modal_tutor_row').append('<div id = "id_addnewtutor" class = "col-xs-12"><button class = "col-xs-12 btn btn-default btn-lg btn-primary">Add a new tutor</button></div>');
		
		/* when add a new tutor is been added, also bind click event listeners */
		$('#modal_tutor_row .btn-primary').off('click').click(function(){
			
			/* clicking add a new tutor */
			$('#id_tutormodal_oldpswd').prop('disabled',true);
			$('#pswd_block').removeClass('collapse');
			$('#pswd_block').css('height','153px');
			$('#modal_edit_tutor input').val('');
			$('#modal_edit_tutor').modal('show');
			$('#modal_edit_tutor .modal-title').html('Adding a new tutor');
			$('#modal_edit_tutor h4').last().html('Password');
		})
	});
	
	/* populating tutor modal */
	socket.on('send_profile',function(json){
		append_tutor_entry(json);
	});
	/*  */
}

function tutor_lvl1_binding(){
	
	/* show buttons */
	$('#nav_profiles').css('display','block');
	$('#id_navbar_ttcontrol li').css('display','block');
	
	/* binding functions */
	
	/* bind clicking tutor profile button */
	$('#nav_profiles').click(function(){
		socket.emit('edit_tutor',$('#id_tutormodal_hashed_id').val(),function(json){
			
			$('#id_tutormodal_oldpswd').prop('disabled',false);
			$('#pswd_block').addClass('collapse');
			$('#pswd_block').collapse('hide');
			$('#modal_edit_tutor').modal('show');
			$('#modal_edit_tutor .modal-title').html('Updating an existing tutor');
			
			$('#id_tutormodal_name').val(json[0].name);
			$('#id_tutormodal_email').val(json[0].email);
			$('#id_tutormodal_mobile').val(json[0].mobileno);
			$('#id_tutormodal_hashed_id').val(json[0].hashed_id);
			
			$('#modal_edit_tutor h4').last().html('<a href = "#pswd_block" data-toggle = "collapse">Password</a>');
			
		});
	});
	
	/* edit tutor info modal fn */
	$('#id_tutormodal_email')
	.tooltip({
		title:		'Email address in use. Please choose an unique e-mail address',
		placement:	'right',
		trigger:	'manual'
	})
	.on('keydown',function(){
		$(this).tooltip('hide');
		$(this).parent().parent().removeClass('has-error');
	});
	
	$('#id_tutormodal_oldpswd')
	.tooltip({
		placement:	'right',
		trigger:	'manual'
	})
	.on('blur',function(){
		if($(this).val()==''){
			$(this).tooltip({title:'Please enter the existing password.'});
			$(this).tooltip('show');
			$(this).parent().parent().addClass('has-error');
			$(this).keyup(function(){
				if($(this).val()!=''){
					$(this).tooltip('hide');
					$(this).parent().parent().removeClass('has-error');
					$(this).off('keyup');					
				}
			})
		}
	});
	
	$('#id_tutormodal_newpswd')
	.tooltip({
		title:		'Please enter a new password.',
		placement:	'right',
		trigger:	'manual'
	})
	.on('blur',function(){
		if($(this).val()==''){
			$(this).tooltip('show');
			$(this).parent().parent().addClass('has-error');
			$(this).keyup(function(){
				if($(this).val()!=''){
					$(this).tooltip('hide');
					$(this).parent().parent().removeClass('has-error');
					$(this).off('keyup');					
				}
			})
		}
	});
	
	$('#id_tutormodal_newpswd_reenter')
	.tooltip({
		title:		'Passwords do not match.',
		placement:	'right',
		trigger:	'manual'
	})
	.on('blur',function(){
		if(!check_same_pswd()){
			$(this).tooltip('show');
			$(this).parent().parent().addClass('has-error');
			$(this).keyup(function(){
				if(check_same_pswd()){
					$(this).tooltip('hide');
					$(this).parent().parent().removeClass('has-error');
					$(this).off('keyup');
				}
			})
		}
	});
	
	$('#pswd_block').on('hidden.bs.collapse',function(){
		$('#pswd_block input').val('');
		$('#pswd_block .has-error').removeClass('has-error');
		$('#pswd_block input').tooltip('hide');
	});
	
	/* populate the filter modal with relevant information */
	$('#modal_filter .panel .panel-footer button').click(function(){
		if($(this).parent().parent().hasClass('panel-primary')){
			if($(this).html()=='Select None'){
				$(this).parent().parent().children('.panel-body').children('button').removeClass('noselect');
				$(this).parent().parent().children('.panel-body').children('button').click();
			}else if($(this).html()=='Select All'){
				$(this).parent().parent().children('.panel-body').children('button').addClass('noselect');	
				$(this).parent().parent().children('.panel-body').children('button').click();
			}
			update_lesson_blocks_tt();
		}
	});
			
	$('#modal_filter .panel').click(function(){
		if(!$(this).hasClass('panel-primary')){
			$(this).parent().children('div.panel-primary').removeClass('panel-primary').addClass('panel-default');
			$(this).addClass('panel-primary');
			update_lesson_block_color();
			
			/* because populate_modal_filter unbinds click listeners, also resets the colours of nonactive panels */
			populate_modal_filter();
			$('.noshow').removeClass('noshow');
			
			$(this).children('div.panel-body').children('button').off('click').click(function(){
				if($(this).parent().parent().hasClass('panel-primary')){
					/* button press, toggle noselect class */
					modal_filter_button_click($(this));
					update_lesson_blocks_tt();
				}
			})
		}
	});
	
	$('#nav_filter').click(function(){
		$('#modal_filter').modal('show');
	});
	
	$('#modal_filter')
	.on('show.bs.modal',function(){
		if($('#modal_filter .panel-primary .panel-body button').length==0){
			populate_modal_filter();
			update_lesson_block_color();
			$('#modal_filter .panel-primary .panel-body button').click(function(){
				modal_filter_button_click($(this));
				update_lesson_blocks_tt();
			});
			
		}
	});
	
	
	/* key functionality */
	socket.on('server_to_client_tablename',function(tablename){
		$('#nav_name').html(tablename.substring(3));
	});
	
	socket.on('add_lesson_block',function(lessonblock_json){
		add_lesson_block(lessonblock_json);
	});
	
	socket.on('clearblocks',function(){
		$('#id_table_scaffold_overlay div').empty();
	});
	
	socket.on('server_to_all_tt_deleted',function(){
		/* current timetable deleted. load modal info, load the next timetable.  */
		$('#modal_warning .modal-title').html('Warning');
		$('#modal_warning .modal-body').html('Another user has deleted this timetable. You will now be transferred to another timetable.');
		$('#modal_warning').modal('show');
		socket.emit('on_document_load');
	});
	
	/* server.js will decide what is to be loaded, and what is not */
	socket.emit('on_document_load');
	
	socket.on('server_to_client_rearrange_blocks',function(){
		rearrange_blocks();
	})
	
	socket.on('server_to_all_update_block',function(i){
		
		//$('#'+i.hashed_id).remove(); //does not work somehow
		$('div').remove('#'+i.hashed_id);
		add_lesson_block(i);
		
		rearrange_blocks();
	});
	
	socket.on('server_to_client_update_failed',function(err){
		//failure state here
		$('#modal_warning .modal-title').html('Warning');
		$('#modal_warning .modal-body').html(err);
		$('#modal_warning').modal('show');
	});
	
	socket.on('server_to_all_remove_block',function(i){
		$('#'+i).remove();
		rearrange_blocks();
	});
	
	
	/* list of timetables modal */
	$('#nav_tt')
	.modal({keyboard: true,show:false})
	.on('hide.bs.modal',function(){
		$(document).off('keypress');
		$(document).off('keyup');
	})
	.on('shown.bs.modal',function(){
		
		/* when modal is shown, bind click listeners for ok, key press enter, and esc preferably */
		$('.modal-button-ok').off('click').click(function(){
			var intent = $(this).attr('id').substring(10).substring(0,3);
			
			if((intent=='ren')&&($('#id_input_modal_tt').val()==$('#nav_name').html())){
				$('#nav_tt').modal('hide');
				return false;
			}
			if(intent=='new'&&$('#id_input_modal_tt').val()==''){
				$('.modal-input')
				return false;
			}
			
			var jsonO ={};
			jsonO['target']='tt_'+$('#nav_name').html();
			jsonO['newname']='tt_'+$('#id_input_modal_tt').val();
			jsonO['mode']=intent;
			socket.emit('tt_manipulation',jsonO,function(o){
				if(o=='not_unique'){
					$('#id_input_modal_tt').tooltip('destroy').tooltip({
						title:'Need a unique name.'
					})
					.tooltip('show')
					.keypress(function(){
						$('.modal-input').parent().parent().removeClass('has-error');
						$(this).off();
						$(this).tooltip('destroy');
					})
					.select();
					$('.modal-input').parent().parent().addClass('has-error');
					
					
				}else{
					if (o == 'rename_done'){
						var jsonO1 = {};
						jsonO1['oldchannel']=jsonO.target;
						jsonO1['newchannel']=jsonO.newname;
						socket.emit('tt_load_tt',jsonO1);
						$('#nav_tt').modal('hide');
					}else{
						socket.emit('on_document_load');
						$('#nav_tt').modal('hide');
					}
				}
			});
			
		});
		
		/*does not need to bind cancel button because they already work as intended*/
		
		/* when modal shows up, bind enter key to clicking OK button */
		$(document)
		.keypress(function(i){
			if (i.which==13){
				$('.modal-button-ok').click();
			}
		})
		.keyup(function(){
			$('.modal-input').tooltip({
				title:'Must not contain special characters.'
			});
			if(!/^[a-zA-Z0-9-_]*$/.test($('.modal-input').val())){
				$('.modal-input').tooltip('show');
				$('.modal-input').parent().parent().addClass('has-error');
				/* no space warning */
			}else{
				$('.modal-input').tooltip('hide');
				$('.modal-input').parent().parent().removeClass('has-error');
			}
		})
		
	});
	
	/* creating new timetable */
	$('#nav_new').click(function(){
		$('#nav_tt').modal('show')	
		.on('shown.bs.modal',function(){
			$('#id_input_modal_tt').val('');
			$('#id_input_modal_tt').select();
		});
		$('#nav_tt h4').html('New Timetable');
		$('#nav_tt div.modal-footer')
		.empty()
		.append(
			'<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>'+
			'<button type="button" class="modal-button-ok btn btn-success" id = "id_button_new_tt_ok">OK</button>');
		
		$('#nav_tt div.modal-body')
		.empty()
		.append('<div class = "well"><div id = "modal_tt" class = "row"></div></div>');
		socket.emit('tt_load',function(jsonO){
			populate_tt_modal(jsonO);
			populate_tt_modal_input('New');
		});
		
	});
	
	/* save a copy */
	$('#nav_saveacopy').click(function(){
		$('#nav_tt').modal('show')
		.on('shown.bs.modal',function(){
			$('#id_input_modal_tt').val($('#nav_name').html() + '_copy');
			$('#id_input_modal_tt').select();
		});
		$('#nav_tt h4').html('Save A Copy');
		$('#nav_tt div.modal-footer')
		.empty()
		.append('<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button><button type="button" class="modal-button-ok btn btn-success" id = "id_button_saveacopy_tt_ok">OK</button>');
		
		$('#nav_tt div.modal-body')
		.empty()
		.append('<div class = "well"><div id = "modal_tt" class = "row"></div></div>');
		socket.emit('tt_load',function(jsonO){
			populate_tt_modal(jsonO);
			populate_tt_modal_input('Save As');
		});
	});
	
	/* rename the timetable */
	$('#nav_name').click(function(){
		$('#nav_tt').modal('show')
		.on('shown.bs.modal',function(){
			$('#id_input_modal_tt').val($('#nav_name').html());
			$('#id_input_modal_tt').select();
		});
		$('#nav_tt h4').html('Rename Timetable');
		$('#nav_tt div.modal-footer')
		.empty()
		.append(
			'<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>'+
			'<button type="button" class="modal-button-ok btn btn-success" id = "id_button_rename_tt_ok">OK</button>');
		
		$('#nav_tt div.modal-body')
		.empty()
		.append('<div class = "well"><div id = "modal_tt" class = "row"></div></div>');
		socket.emit('tt_load',function(jsonO){
			populate_tt_modal(jsonO);
			populate_tt_modal_input('Rename');
		});
	});
	
	/* load and edit a new timetable */
	$('#nav_load').click(function(){
		$('#nav_tt').modal('show');
		$('#nav_tt h4').html('Load Timetable');
		$('#nav_tt div.modal-footer')
		.empty();
		$('#nav_tt div.modal-body')
		.empty()
		.append('<div class = "well"><div id = "modal_tt" class = "row"></div></div>');
		
		socket.emit('tt_load',function(jsonO){
			populate_tt_modal(jsonO);
			$('#modal_tt').children('div').each(function(){
				$(this).append('<div class = "col-xs-2"><button type="button" class="delete_tt_button btn btn-danger" id="id_button_tt_delete_'+$(this).children('div:first-child').html()+'">Delete</button></div>');
			});
			$('.modal_load_tt_unit').off('click').click(function(){
				var jsonO = {};
				jsonO['oldchannel']=$('#nav_name').html();
				jsonO['newchannel']='tt_'+$(this).children('div:first-child').html();
				socket.emit('tt_load_tt',jsonO);
				$('#nav_tt').modal('hide');
			});
			$('.delete_tt_button').off('click').click(function(){
				if(confirm('Are you sure you want to delete this timetable?\n\nThis action cannot be undone.')){
					var del_id = $(this).attr('id');
					var jsonO1 = {};
					jsonO1['mode'] = 'delete';
					jsonO1['target'] = 'tt_'+$(this).attr('id').substring(20);
					socket.emit('tt_manipulation',jsonO1,function(o){
						if(o=='tt_delete_done'){
							socket.emit('on_document_load');
							$('#'+del_id).parent().parent().remove();
						}
					});
				}
				return false;
			});
		});
	});
	
	bind_fn_creating_blocks();
	
	/* block control */
	
	socket.on('append_tutor_slot',function(o){
		$('#id_edit_block_popup #id_tutorname').append('<option>'+o+'</option>');
	});
	
	$('#id_screen,#cancel_button').click(function(){
		reset_block();
	});
	
	$('#delete_button').click(function(){
		delete_block();
		/* this is the delete button in edit lesson block */
		return false;
	});
	
	$('#save_button').click(function(){
		save_block();
	});
	
}

function tutor_lvl0_binding(){
	
	tutor_lvl1_binding();
	
	
	$('#id_navbar_ttcontrol li').css('display','none');
	
	$('#id_tutorname').prop('disabled',true);
}

function check_same_pswd(){
	if($('#id_tutormodal_newpswd_reenter').val()!=$('#id_tutormodal_newpswd').val()){
		return false;
	}else{
		return true;
	}
}

function append_tutor_entry(json){	
	$('#modal_tutor_row').append('<div class = "col-xs-12 modal_tutor_unit" id = "'+json.hashed_id+'">'+
	'<div class = "col-xs-3">'+json.name+'</div>'+
	'<div class = "col-xs-3">'+json.mobileno+'</div>'+
	'<div class = "col-xs-4">'+json.email+'</div>'+
	'<div class = "col-xs-2"><button class = "btn btn-danger">Delete</button></div>'+
	'</div>');
	
	
	$('#modal_tutor .modal_tutor_unit:last-child .btn-danger').click(function(){
		if(confirm('Are you sure you want to delete this tutor?\n\nThis action cannot be undone.')){
			socket.emit('delete_tutor',$(this).parent().parent().attr('id'),function(o){
				if(o.message=='tutor_record_deleted'){
					
					$('#modal_warning .modal-title').html('Deletion Completed');
					$('#modal_warning .modal-body').html('Tutor record deleted.');
					$('#modal_warning').modal('show');
					
					$('#'+o.hashed_id).remove();
				}
			});
		}
		/* return false, so won't load the tutor profile */
		return false;
	});
	$('.modal_tutor_unit:last-child').click(function(){
		socket.emit('edit_tutor',$(this).attr('id'),function(json){
			
			/* clicking on the existing tutor slot */
			
			$('#id_tutormodal_oldpswd').prop('disabled',false);
			$('#pswd_block').addClass('collapse');
			$('#pswd_block').collapse('hide');
			$('#modal_edit_tutor').modal('show');
			$('#modal_edit_tutor .modal-title').html('Updating an existing tutor');
			
			$('#id_tutormodal_name').val(json[0].name);
			$('#id_tutormodal_email').val(json[0].email);
			$('#id_tutormodal_mobile').val(json[0].mobileno);
			$('#id_tutormodal_hashed_id').val(json[0].hashed_id);
			
			$('#modal_edit_tutor h4').last().html('<a href = "#pswd_block" data-toggle = "collapse">Password</a>');
			
		})
	});
		
}

function update_lesson_blocks_tt(){
	$('.lessonblock').each(function(){
		switch($('div#modal_filter div.panel-primary').attr('id').substring(6).toLowerCase()){
			case 'class':
				if($('#id_button_'+filter_class_name($(this).children('.lessonblock_classname').html())).hasClass('noselect')){
					$(this).addClass('noshow');
				}else{
					$(this).removeClass('noshow');
				}
			break;
			case 'tutor':
				var tutorname = $(this).children('.lessonblock_tutorname').html().replace(/ /g,'');
				tutorname = tutorname == '' ? 'notutorassigned' : tutorname;
				if($('#id_button_'+tutorname).hasClass('noselect')){
					$(this).addClass('noshow');
				}else{
					$(this).removeClass('noshow');
				}
			break;
			case 'location':
				if($('#id_button_'+filter_location($(this).children('.lessonblock_location').html())).hasClass('noselect')){
					$(this).addClass('noshow');
				}else{
					$(this).removeClass('noshow');
				}
			break;
			default:
				console.log('error315');
			break;
		}
	});
	rearrange_blocks();
}

function update_lesson_block_color(){
	$('.lessonblock').each(function(){
		color_blocks($(this));
	})
}

function modal_filter_button_click(i){
	if(i.hasClass('noselect')){
		i.removeClass('noselect');
		color_blocks(i);
	}else{
		i.addClass('noselect');
		i.css('background-color','#fff');
	}
}

function populate_modal_filter(){
	$('#panel_class').children('div.panel-body').empty();
	$('#panel_tutor').children('div.panel-body').empty();
	$('#panel_location').children('div.panel-body').empty();
	
	$('div#id_table_scaffold_overlay div div.lessonblock').each(function(){
		populate_modal_filter_class($(this).children('.lessonblock_classname').html());
		populate_modal_filter_tutor($(this).children('.lessonblock_tutorname').html());
		populate_modal_filter_location($(this).children('.lessonblock_location').html());
	});
	order_filter_button();
	
	$('#modal_filter .panel-primary .panel-body button').each(function(){
		color_blocks($(this));
	})
	
	$('div#modal_filter div.panel').each(function(){
		if(!$(this).hasClass('panel-primary')){
			$(this).children('div').children('button').removeClass('btn-default');
		}else{
			$(this).children('div.panel-footer').children('button').addClass('btn-default');
		}
	})
}

function order_filter_button(i){
	$('#panel_class').children('div.panel-body').children('button:not(#id_button_special)').each(function(){
		var b1 = $(this);
		$('#panel_class').children('div.panel-body').children('button:not(#id_button_special)').each(function(){
			var b2 = $(this);
			if(b1.html()!=b2.html()){
				if(Number(b1.html().substring(1))>Number(b2.html().substring(1))){
					b1.insertAfter(b2);
				}else{
					b2.insertAfter(b1);
				}
			}
		})
	})
	$('#id_button_special').insertAfter($('#panel_class').children('div.panel-body').children('button:last-child'));
	
	var a=['tutor','location'];
	for (i=0;i<a.length;i++){
		$('#panel_'+a[i]).children('div.panel-body').children('button').each(function(){
			var b1 = $(this);
			$('#panel_'+a[i]).children('div.panel-body').children('button').each(function(){
				var b2 = $(this);
				if(b1.html()!=b2.html()){
					if(b1.html()>b2.html()){
						b1.insertAfter(b2);
					}else{
						b2.insertAfter(b1);
					}
				}
			});
		});
	}
	$('#id_button_notutorassigned').insertAfter($('#panel_tutor').children('div.panel-body').children('button:last-child'));
	$('#id_button_NoLocationAssigned').insertAfter($('#panel_location').children('div.panel-body').children('button:last-child'));
	
}

function color_blocks(i){
	switch (i.get(0).tagName){
		case 'BUTTON':
			i.css('background-color',choose_color(i.attr('id').substring(10)));
		break;
		case 'DIV':
			switch($('#modal_filter .modal-body .panel-primary').attr('id')){
				case 'panel_class':
					i.css('background-color',choose_color(filter_class_name(i.children('.lessonblock_classname').html())));
				break;
				case 'panel_tutor':
					var tutorname = i.children('.lessonblock_tutorname').html().replace(/ /g,'');
					if(tutorname==''){
						tutorname='notutorassigned';
					}
					i.css('background-color',choose_color(tutorname));
				break;
				case 'panel_location':
					i.css('background-color',choose_color(filter_location(i.children('.lessonblock_location').html())));
				break;
			}
		break;
		default:
		
		break;
	}
}

function choose_color(i){
	
	/* place custom colour palette here */
	
	switch(i){
		case 'Y1':
			return '#F2AEAE'
		break;
		
		case 'Y2':
			return '#F09D9D'
		break;
		
		case 'Y3':
			return '#EE8D8D'
		break;
		
		case 'Y4':
			return '#EB7D7D'
		break;
		
		case 'Y5':
			return '#E86C6C'
		break;
		
		case 'Y6':
			return '#E65C5C'
		break;
		
		case 'Y7':
			return '#4D7EC9'
		break;
		
		case 'Y8':
			return '#336CC1'
		break;
		
		case 'Y9':
			return '#1959BA'
		break;
		
		case 'Y10':
			return '#0047B2';
		break;
		
		case 'Y11':
			return '#D6AD33'
		break;
		
		case 'Y12':
			return '#c90'
		break;
		case 'special':
		case 'notutorassigned':
		case 'NoLocationAssigned':
			return '#ccc'
		break;
	}
	
	var str = $.sha256(i); 
	R = (str.charCodeAt(0)*str.charCodeAt(1))%255;
	G = (str.charCodeAt(2)*str.charCodeAt(3))%255;
	B = (str.charCodeAt(4)*str.charCodeAt(5))%255;
	return 'rgb(' + R + ',' + G + ','+ B + ')';
	
}

function deheaded_string_to_number(i){
	i = i.replace(/ /g,'');
	if(i==''){
		return 'special';
	}else if(i.length==1&&$.isNumeric(i)){
		return i;
	}else if ($.isNumeric(i.substring(0,2))&&Number(i.substring(0,2))<13&&Number(i.substring(0,2))>0){
		return i.substring(0,2);
	}else if ($.isNumeric(i.substring(0,1))){
		return i.substring(0,1);
	}
}

function format_classname(i){
	/* this is how it will be presented in the class name filter */
	return 'Y'+ i;
}

function filter_class_name(i){
	i = i.replace(/ /g,'');
	if (i.length<2){
		return 'special';
	}
	switch(i.substring(0,1)){
		case 'Y':
		case 'y':
			switch(i.substring(1,2)){
				case 'r':
				case 'R':
					/* Yr# or YR# */
					if(deheaded_string_to_number(i.substring(2))=='special'){
						return 'special';
					}else{
						return format_classname(deheaded_string_to_number(i.substring(2)));
					}
				break;
				case 'e':
				case 'E':
					/* year# or YEAR# */
					if(i.length<5){
						return 'special';
					}else if(i.substring(0,4).toLowerCase()!='year'){
						return 'special';
					}
					if(deheaded_string_to_number(i.substring(4))=='special'){
						return 'special';
					}else{
						return format_classname(deheaded_string_to_number(i.substring(4)));
					}
				break;
				default:
					if($.isNumeric(i.substring(1,2))){
						/* Y# or y# */
					if(deheaded_string_to_number(i.substring(1))=='special'){
						return 'special';
					}else{
						return format_classname(deheaded_string_to_number(i.substring(1)));
					}
						
					}else{
						return 'special';
					}
				break;
			}
		break;
		default:
			return 'special';
		break;
	}
}

function populate_modal_filter_class(i){
	var classname = filter_class_name(i);
	var flag = true;
	$('#panel_class').children('div.panel-body').children('button').each(function(){
		if($(this).html()==classname){
			flag = false;
		}
	})
	if(flag){
		$('#panel_class').children('div.panel-body').append('<button type = "button" class = "filter_toggle btn btn-default" id = "id_button_'+classname+'">'+classname+'</button>');
	}
}

function populate_modal_filter_tutor(i){
	if (i.replace(/ /g,'')==''){
		var tutorname = 'no tutor assigned';
	}else{
		var tutorname = i;
	}
	var flag = true;
	$('#panel_tutor').children('div.panel-body').children('button').each(function(){
		if($(this).html()==tutorname){
			flag = false;
		}
	})
	if(flag){
		$('#panel_tutor').children('div.panel-body').append('<button type = "button" class = "filter_toggle btn btn-default" id = "id_button_'+tutorname.replace(/ /g,'')+'">'+tutorname+'</button>');
	}
}

function populate_modal_filter_location(i){
	var locationname = filter_location(i);
	var flag = true;
	$('#panel_location').children('div.panel-body').children('button').each(function(){
		if($(this).html()==locationname){
			flag = false;
		}
	})
	if(flag){
		$('#panel_location').children('div.panel-body').append('<button type = "button" class = "filter_toggle btn btn-default" id = "id_button_'+locationname.replace(/ /g,'')+'">'+locationname+'</button>');
	}	
}

function filter_location(i){
	i = i.replace(/ /g,'');
	
	if(i==''){
		return 'NoLocationAssigned';
	}
	
	if(i.length==1){
		if($.isNumeric(i)){
			return 'Rm'+i;
		}else{
			return 'NoLocationAssigned';
		}
	}
	if(i.substring(0,1).toLowerCase()=='r'){
		if($.isNumeric(i.substring(1,2))){
			return 'Rm'+i.substring(1);
		}else if(i.substring(1,2).toLowerCase()=='m'){
			if(i.length==2||(!$.isNumeric(i.substring(2,3)))){
				return 'NoLocationAssigned';
			}else{
				return 'Rm'+i.substring(2);
			}
		}else if(i.substring(1,2).toLowerCase()=='o'){
			if(i.length<5||i.substring(0,4).toLowerCase()!='room'||$.isNumeric(i.substring(4,5))){
				return 'NoLocationAssigned';
			}else{
				return 'Rm'+i.substring(4);
			}
		}
	}else{
		return 'NoLocationAssigned';
	}
}

function populate_tt_modal_input(i){
	$('#nav_tt div.modal-body').append(
	'<div class = "row">'+
		'<div class = "form-group">'+
			'<label class = "col-xs-2 control-label" for = "id_input_modal_tt">'+i+':</label>'+
			'<div class = "col-xs-6">'+
				'<input type = "text" data-placement="right" class = "modal-input form-control input-sm" id = "id_input_modal_tt">'+
			'</div>'+
		'</div>'+
	'</div>');
}

function populate_tt_modal(jsonO){
	for (i=0;i<Object.keys(jsonO).length;i++){
		$('#modal_tt').append('<div id ="modal_load_tt_unit_'+i+'" class = "col-xs-12 modal_load_tt_unit'+ (jsonO[i][0]==$('#nav_name').html() ? ' activett' : '' )+'"></div>');
		$('#modal_load_tt_unit_'+i)
		.append('<div class = "col-xs-3">'+jsonO[i][0]+'</div>')
		.append('<div class = "col-xs-7">'+jsonO[i][1].split('T')[0]+'</div>')
	}
}

function add_lesson_block(jsonObj){
	$('.activeblock').removeClass('activeblock');
	var o = cvt_day_time_to_pos_height(jsonObj.day,jsonObj.starttime,jsonObj.endtime);
	
	o.pos.append('<div class = "lessonblock activeblock"></div>');
	$('.activeblock').append('<span class = "lessonblock_classname"></span><span class = "lessonblock_tutorname"></span><span class = "lessonblock_location"></span><span class = "lessonblock_day"></span><span class = "lessonblock_starttime"></span><span class = "lessonblock_endtime"></span><span class = "lessonblock_students"></span><span class = "lessonblock_notes"></span>');
	
	$('.activeblock span').each(function(){
		$(this).html(eval('jsonObj.'+$(this).attr('class').substring(12)));
		});
	
	$('.activeblock').attr('id',jsonObj.hashed_id);
	
	$('.activeblock').css({
		'left':'0',
		'top':o.ttop,
		'width':'100%',
		'height':o.height
		});
	color_blocks($('.activeblock'));
	$('.activeblock').removeClass('activeblock');
	bind_fn_lessonblocks();
}

function valid_time(i){
	if(i.replace(/ /g,'')==''){
		return false;
	}
	
	var si = i.split(':');
	
	for(j=0;j<si.length;j++){
		if(!($.isNumeric(si[j])))
		{
			return false;
		}
	}
	
	return true;
}

function save_block(){
	
	var flag = true;
	if(!valid_time($('#id_starttime').val())){
		/* highlight id start time */
		$('#id_starttime').parent().parent().addClass('has-error');
		$('#id_starttime').tooltip({
			title:'You must enter a valid start time in the form of HH:MM.',
			placement:'top',
			trigger:'focus'
		}).tooltip('show');
		flag = false;
	}
	
	if(!valid_time($('#id_endtime').val())){
		/* highlight id start time */
		$('#id_endtime').parent().parent().addClass('has-error');
		$('#id_endtime').tooltip({
			title:'You must enter a valid end time in the form of HH:MM.',
			placement:'bottom',
			trigger:'focus'
		}).tooltip('show');
		flag = false;
	}
	
	if (!flag){
		return false; 
	}
	
	var o = cvt_day_time_to_pos_height($('#id_day').val(),$('#id_starttime').val(),$('#id_endtime').val());
	$('.activeblock').appendTo(o.pos);
	$('.activeblock').css({
		'top':o.ttop,
		'height':o.height
		});
	var item = {};
	$('.activeblock').empty().append('<span class = "lessonblock_classname"></span><span class = "lessonblock_tutorname"></span><span class = "lessonblock_location"></span><span class = "lessonblock_day"></span><span class = "lessonblock_starttime"></span><span class = "lessonblock_endtime"></span><span class = "lessonblock_students"></span><span class = "lessonblock_notes"></span>');
	$('.activeblock span').each(function(){
		var attri = $(this).attr('class').substring(12);
		$(this).html($('#id_'+$(this).attr('class').substring(12)).val());
		var value = $(this).html();
		item[attri] = value;
	});
	$.extend(item, {'timetablename':'tt_'+$('#nav_name').html()})
	
	if($('.activeblock').hasClass('newblock')){
		$('.activeblock').attr('id',$.sha256(Date.now()));
		$.extend(item, {'hashed_id':$('.activeblock').attr('id')});
		socket.emit('save_new_block',item);
	}else{
		$.extend(item, {'hashed_id':$('.activeblock').attr('id')});
		socket.emit('save_existing_block',item);
	}
	$('.activeblock').off().removeClass().addClass('inprogress').on('mousedown',function(){return false;});
	
	dismiss_editblock();
}

function delete_block(){
	if($('.activeblock').hasClass('newblock')){
		$('.activeblock').remove();
	}else{
		socket.emit('delete_existing_block',{'timetablename':'tt_'+$('#nav_name').html(),'hashed_id':$('.activeblock').attr('id')});
		$('.activeblock').off().removeClass().addClass('inprogress').on('mousedown',function(){return false;});
	}
	dismiss_editblock();
}

function reset_block(){
	if($('.activeblock').hasClass('newblock')){
		$('.activeblock').remove();
	}
	dismiss_editblock();
}

function bind_fn_lessonblocks(){

	$('div.lessonblock').off()
	.on('mousedown',function(d){
		$('div.lessonblock').off('mousemove');
		$('#hoverinfo').css('disiplay','none');
		if(d.which!=1){return false;}
		
		//in case there are other blocks with the class "activeblock"
		$('div.activeblock').removeClass('activeblock');
		$(this).addClass('activeblock');
		
		//determines if it's resizing or moving we want
		if($('.activeblock').css('cursor')=='ns-resize'){
			var flag = 'resize';
			var oldheight = parseInt($('.activeblock').css('height'));
		}else{
			var flag = 'default';
		}
		
		var rd = relative_offsetY(d,'.activeblock');
		var rdx = relative_offsetX(d,'.activeblock');
		
		$(document)
		.on('mousemove',function(m){
			var rm = relative_offsetY(m,'#id_table_scaffold');
			var rmx = relative_offsetX(m,'#id_table_scaffold');
			
			$('.activeblock').addClass('inprogress');
			
			if(flag == 'default'){
				
				if (round_off_offsetY(rm-rd)+parseInt($('.activeblock').css('height'))-1<=parseInt($('#id_table_scaffold tbody tr:last-child').position().top)+parseInt($('#id_table_scaffold tbody tr:last-child').css('height'))){
					$('.activeblock').css({
						'top': round_off_offsetY(rm-rd),
					})
				}
				
				$('.activeblock').appendTo(round_off_offsetX(rmx));
				
				/*
				if (Math.round(round_off_offsetX(rmx).position().left) == 0){
					
				}else if(Math.round($('.activeblock').parent().position().left)>Math.round(round_off_offsetX(rmx).position().left)){
					$('.activeblock').appendTo($('.activeblock').parent().prev());
				}else if(Math.round($('.activeblock').parent().position().left)<Math.round(round_off_offsetX(rmx).position().left)){
					$('.activeblock').appendTo($('.activeblock').parent().next());
				}
				*/
				
			}else{
				if(parseInt($('.activeblock').css('top'))+parseInt($('.activeblock').css('height')) > relative_offsetY(m,'#id_table_scaffold')){
					$('.activeblock').css('height',round_off_offsetY(oldheight+m.pageY-d.pageY));
				}else{
					if(parseInt($('.activeblock').css('top'))+parseInt($('.activeblock').css('height'))<parseInt($('#id_table_scaffold tbody tr:last-child').position().top)+parseInt($('#id_table_scaffold tbody tr:last-child').css('height'))){	
						$('.activeblock').css('height',round_off_offsetY(oldheight+m.pageY-d.pageY));
					}
				}
				
			}
		})
		.on('mouseup',function(u){
			$(document).off('mouseup');
			$(document).off('mousemove');
			
			if(d.pageX==u.pageX&&d.pageY==u.pageY){
				//if button down and button up is the same, call edit dialogue
				call_editblock();
				populate_edit_block();
			}else{			
				//if not the same, just update the day/time, by calling edit dialogue (which auto updates the day/time), and then saving
				
				call_editblock();
				populate_edit_block();
				save_block();
				$('#id_screen,#id_edit_block_popup').finish();
			}
		});
		
		//return false to stopstriggering the parent onmousedown event
		return false;
	})
	
	.on('mousemove',function(m){
		$('#hoverinfo').css({
			'display'	:'block',
			'top'		:m.pageY-20,
			'left'		:m.pageX+20,
			'background-color'	:$(this).css('background-color')
		}).html($(this).html());
		
		if(relative_offsetY(m,$(this))-(parseInt($(this).css('height')))>-10){
			//change cursor to vertical resizing
			$(this).css('cursor','ns-resize');
		}else{
			//change cursor to default
			$(this).css('cursor','default');
		}
	})
	
	.on('mouseout',function(){
		$('#hoverinfo').css('display','none');
		//change cursor to default
		$(this).css('cursor','default');
	});
}

function bind_fn_creating_blocks(){
	
	//binding overlay element with on mouse down event
	$('#id_table_scaffold_overlay div:not(:first-child)').on('mousedown',function(d){
		
		//if not a left click, terminate the function
		if(d.which!=1||d.offsetY<35){return false;}
		
		//otherwise, append a div object
		$(this).append('<div class = "lessonblock activeblock"></div>');
		$('div.activeblock').css({
			'top':round_off_offsetY(d.offsetY),
			'left':0,
			'height':'32px',
			'width':'100%'
		});
		
		//when mouse moves, the active div object changes size as well
		$(document).on('mousemove',function(m){
			var rm = relative_offsetY(m,'#id_table_scaffold');
			if(rm>d.offsetY){
				$('div.activeblock').css('height',round_off_offsetY(rm)-round_off_offsetY(d.offsetY) + 32);
			}else{
				$('div.activeblock').css({
					'top':round_off_offsetY(rm),
					'height':round_off_offsetY(d.offsetY)-round_off_offsetY(rm)+32
				});
			}
		});
		
		$(document).on('mouseup',function(u){
			//if the user accidentally triggered mouseup inside the viewport, but outside the div
			bind_fn_lessonblocks();
			
			$('div.activeblock').addClass('newblock').append('<span class = "lessonblock_classname"></span><span class = "lessonblock_tutorname"></span><span class = "lessonblock_location"></span><span class = "lessonblock_day"></span><span class = "lessonblock_starttime"></span><span class = "lessonblock_endtime"></span><span class = "lessonblock_students"></span><span class = "lessonblock_notes"></span>');
			//removing active block should be called elsewhere, like when dismiss_editblock is called
			call_editblock();
			populate_edit_block();
			
			$(document).off('mouseup');
			$(document).off('mousemove');
		});
	});
}

function populate_edit_block(){
	$('.activeblock span').each(function(){
		/* do not need to automatically populate day and time. as it's built into the system*/
		if($(this).attr('class')!='lessonblock_day'&&$(this).attr('class')!='lessonblock_starttime'&&$(this).attr('class')!='lessonblock_endtime'){
			$('#id_'+$(this).attr('class').substring(12)).val($(this).html());
		}else{
		}
	});
}

function call_editblock(){
	
	/* shows edit block dialogue */
	$('#id_screen_container').css('display','block');
	
	
	$('#id_screen,#id_edit_block_popup').css('opacity','0.0');
	$('#id_screen').animate({'opacity':'0.7'},200);
	$('#id_edit_block_popup').animate({'opacity':'1.0'},400);
	
	/* position the dialogue */
	if($('.activeblock').parent().index()<6){
		$('#id_edit_block_popup').removeClass().addClass('container col-sm-12 col-md-5 col-md-offset-'+($('.activeblock').parent().index()+1));
	}else if ($('.activeblock').parent().index()<8){
		$('#id_edit_block_popup').removeClass().addClass('container col-sm-12 col-md-5 col-md-offset-'+(($('.activeblock').parent().index()-6)*3+1));		
	}
	$('#id_edit_block_popup').css('top',parseInt($('.activeblock').css('top'))-20);
	var editblock_bottom = parseInt($('#id_edit_block_popup').css('top'))+parseInt($('#id_edit_block_popup').css('height'));
	var table_saffold_bottom = parseInt($('#id_table_scaffold').position().top)+parseInt($('#id_table_scaffold').css('height'));
	
	if(editblock_bottom>table_saffold_bottom){
		$('#id_edit_block_popup').css('top',parseInt($('#id_edit_block_popup').css('top'))-editblock_bottom+table_saffold_bottom);
	}
	
	/* parsing position to time */
	var starttime = cvt_height_duration(parseInt($('.activeblock').css('top')))+7.5;
	var endtime = starttime + cvt_height_duration(parseInt($('.activeblock').css('height')));
	
	/* updating the parsed time to the relevant fields inside the edit block dialogue */
	$('#id_starttime').val(cvt_dec_to_time(starttime));
	$('#id_endtime').val(cvt_dec_to_time(endtime));
	
	/* updating the parsed day to the relevant field inside the edit block dialogue */
	$('#id_day_'+$('.activeblock').parent().index()).prop('selected',true);
	
	/* focusing on the first field inside the edit block dialogue */
	$('#id_classname').focus();
	
	$('#id_edit_block_popup').on('keypress',function(e){
		switch (e.which){
			case 13:
				save_block();
			break;
			case 27:
				//doesn't work on my lenovo
				reset_block();
			break;
			default:
				//console.log(e.which);
		}
	})
}

function dismiss_editblock(){
	
	$('#id_screen').animate({'opacity':'0.0'},200);
	$('#id_edit_block_popup').animate({'opacity':'0.0'},400,function(){
		$('#id_screen_container').css('display','none');
		
		/* if the user entered the time in the wrong format, dissmiss edit block will remove both the red border and the tooltip */
		$('#id_starttime').parent().parent().removeClass('has-error');
		$('#id_starttime').tooltip('destroy');
		
		$('#id_endtime').parent().parent().removeClass('has-error');
		$('#id_endtime').tooltip('destroy');
	});
	$('div.activeblock').removeClass('activeblock');
	$('div.newblock').removeClass('newblock');
	$('#id_edit_block_popup').off('keypress');
	
	bind_fn_lessonblocks();
}

function relative_offsetY(e,r){
	return parseInt(e.pageY)-parseInt($(r).offset().top);
}

function relative_offsetX(e,r){
	return parseInt(e.pageX)-parseInt($(r).offset().left);
}

function round_off_offsetX(i){
	var o;
	
		$('.scaffold_overlay_unit').each(function(){
			if($(this).position().left-i<0&&$(this).position().left+parseInt($(this).css('width'))-i>0){
				o = $(this);
			}
		});
	
	return o;
}

//input an analogue position, output a nearest digital position if error, returns 0
function round_off_offsetY(i){
	var o;
	$("#id_table_scaffold tbody tr:not(:first-child)").each(function(){
		if(($(this).position().top-i<0)&&($(this).position().top+parseInt($(this).css('height'))-i>0)){
			o = $(this).position().top;
		}
	});
	return o;
}

function rearrange_blocks(){
	$('div#id_table_scaffold_overlay').children('div').each(function(){
		var dayblock = $(this);
		dayblock.children('div:not(.noshow)').each(function(){
			var block1 = $(this);
			dayblock.children('div:not(.noshow)').each(function(){
				var block2 = $(this);
				if (parseInt(block1.css('top')) > parseInt(block2.css('top'))){
					block2.insertAfter(block1);
				}else if (parseInt(block1.css('top')) < parseInt(block2.css('top'))){
					block1.insertAfter(block2);
				}else{
					/* this will get triggered multiple times, as the .each loop will loop though the same block multiple times */
				}
			})
		});
	});
	resize_blocks();
}

function resize_blocks(){
	$('div#id_table_scaffold_overlay').children('div').each(function(){
		var max_concurr = 1;
		var dayblock = $(this);
		
		$('#id_table_scaffold tbody tr').each(function(){
			var timeslot_concurr = 0;
			var checking_timeslot = parseInt($(this).position().top);
			dayblock.children('div:not(.noshow)').each(function(){
				var blocktop = parseInt($(this).css('top'));
				var blockbottom = parseInt($(this).css('top'))+parseInt($(this).css('height'));
				if(blocktop<=checking_timeslot&&blockbottom>checking_timeslot){
					timeslot_concurr+=1;
				}
			});
			if(timeslot_concurr>max_concurr){
				max_concurr=timeslot_concurr;
			}
		});
		dayblock.children('div:not(.noshow)').css('width',100/max_concurr+'%');
	});	
	stagger_blocks();
}

function stagger_blocks(){
	$('div.lessonblock').css('left','1px');
	$('div#id_table_scaffold_overlay').children('div').each(function(){
		var dayblock = $(this);
		dayblock.children('div:not(.noshow)').each(function(){
			var focusblock = $(this);
			var focusblocktop = parseInt(focusblock.css('top'));
			var focusblockwidth = parseInt(focusblock.css('width'));
			var focusblockbottom = focusblocktop + parseInt(focusblock.css('height'));
			var focusblockleft = 0;
			dayblock.children('div').each(function(){
				var compareblock = $(this);
				var compareblockleft = parseInt(compareblock.css('left'));
				var compareblocktop = parseInt(compareblock.css('top'));
				var compareblockbottom = compareblocktop+parseInt(compareblock.css('height'));
				
				if ((focusblock!=compareblock)&&(compareblockleft==focusblockleft)&&((focusblocktop>=compareblocktop)&&(focusblocktop<compareblockbottom)||(focusblocktop<compareblocktop)&&(focusblockbottom>compareblocktop))){
					focusblockleft += focusblockwidth;
				}
			});
			focusblock.css('left',focusblockleft);
		});
	});
}

function cvt_day_time_to_pos_height(day, starttime, endtime){
	var pos;
	var ttop;
	var height;
	switch (day){
		case 'Mon':
			pos = $('#id_table_scaffold_overlay').children('div:nth-child(2)');
		break;
		case 'Tue':
			pos = $('#id_table_scaffold_overlay').children('div:nth-child(3)');
		break;
		case 'Wed':
			pos = $('#id_table_scaffold_overlay').children('div:nth-child(4)');
		break;
		case 'Thu':
			pos = $('#id_table_scaffold_overlay').children('div:nth-child(5)');
		break;
		case 'Fri':
			pos = $('#id_table_scaffold_overlay').children('div:nth-child(6)');
		break;
		case 'Sat':
			pos = $('#id_table_scaffold_overlay').children('div:nth-child(7)');
		break;
		case 'Sun':
			pos = $('#id_table_scaffold_overlay').children('div:nth-child(8)');
		break;
		default:
			pos = $('#id_table_scaffold_overlay').children('div:nth-child(1)');
		break;
	}
	var nthblock = starttime.split(':')[0]-8 < 0 ? 0 : starttime.split(':')[0]-8 > 14 ? 14 : starttime.split(':')[0]-8 ;
	
	nthblock*=2;
	if(starttime.split(':')[1]=='30'){
		nthblock+=1
	}
	nthblock+=2;
	/* this equation for nthblock works somehow. I don't know why, but it works... so go with it... */
	
	if(Number(cvt_time_to_dec(starttime)) > Number(cvt_time_to_dec(endtime))){
		var heightblock = 1;
	}else{
		var heightblock = (Number(cvt_time_to_dec(endtime)) - Number(cvt_time_to_dec(starttime)))*2;
	}
	
	ttop = parseInt($('#id_table_scaffold tbody tr:nth-child('+nthblock+')').position().top);
	height = parseInt($('#id_table_scaffold tbody tr:nth-child('+(nthblock+heightblock-1)+')').position().top) + parseInt($('#id_table_scaffold tbody tr:nth-child('+(nthblock+heightblock-1)+')').css('height'))-ttop;
	
	return {pos:pos, ttop:ttop, height:height};
}

//converting height to time
function cvt_height_duration(i){
	return Math.round(parseInt(i)/32)/2;
}

//converting decimal to time
function cvt_dec_to_time(i){
	return (Math.floor(i).length < 2 ? '0' : '').toString().concat((Math.floor(i)).toString()).concat((i%1==0 ? ':00' : ':30'));
	
}

//converting time to decimal
function cvt_time_to_dec(i){
	var j = i.split(':')[0];
	if(i.split(':')[1]=='30'){
		j = Number(j) + 0.5;
	}
	return j; 
}