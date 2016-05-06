
var socket = io.connect('http://timetable-gened.rhcloud.com:8000/',function(){
	//'forceNew':true,
});
//*/
/*var socket = io();//*/
$(document).ready(function(){
	
	/* small device has no need for hoverinfo */
	$('#hoverinfo').remove();
	
	/* when a modal is dismissed, all modals are dismissed (weird interactions between jqm and bootstrap modal in that when a modal is dismissed, other active modals freezes) */
	$('.modal').on('hidden.bs.modal',function(){
		$('.modal').modal('hide');
		if($('.navbar-collapse').hasClass('in')){
			$('.navbar-toggle').click();
		};
	})
	
	var viewportwidth = parseInt($('#id_scaffold_parent_viewport').css('width'));
	$('#id_scaffold_overlay_carousel').css('width',viewportwidth*7);
	$('#id_scaffold_parent_carousel').css('width',viewportwidth*7);
	$('#id_scaffold_overlay_carousel').children('div').css('width','14.28571428571429%');
	$('#id_scaffold_parent_carousel').children('div').css('width','14.28571428571429%');
	$('#id_scaffold_overlay_carousel,#id_scaffold_parent_carousel').css('left','0');
	
	
	$(document).on('swipeleft',function(){
		var step = parseInt($('#id_scaffold_overlay_viewport').css('width'));
		var original = parseInt($('#id_scaffold_overlay_carousel').css('left'));
		var index = Math.round(original/step);
		if(index==-6){
			$('#id_scaffold_overlay_carousel,#id_scaffold_parent_carousel').animate({'left':(original-step/3)},200,function(){
				$('#id_scaffold_overlay_carousel,#id_scaffold_parent_carousel').animate({'left':original},100,function(){});
			});
		}else{
			$('#id_scaffold_overlay_carousel,#id_scaffold_parent_carousel').animate({'left':original-step},400,function(){
				$('#id_scaffold_overlay_carousel').children('div').eq(-index+2).children('.lessonblock').removeClass('hidden');
				$('#id_scaffold_overlay_carousel').children('div').eq(-index-1).children('.lessonblock').addClass('hidden');
				bind_fn_lessonblocks();
			});
			
		}
	});
	$(document).on('swiperight',function(){
		var step = parseInt($('#id_scaffold_overlay_viewport').css('width'));
		var original = parseInt($('#id_scaffold_overlay_carousel').css('left'));
		var index = Math.round(original/step);
		if(index==0){
			$('#id_scaffold_overlay_carousel,#id_scaffold_parent_carousel').animate({'left':(original+step/3)},200,function(){
				$('#id_scaffold_overlay_carousel,#id_scaffold_parent_carousel').animate({'left':original},100,function(){});
			});
		}else{
			$('#id_scaffold_overlay_carousel,#id_scaffold_parent_carousel').animate({'left':original+step},400,function(){
				$('#id_scaffold_overlay_carousel').children('div').eq(-index-2).children('.lessonblock').removeClass('hidden');
				$('#id_scaffold_overlay_carousel').children('div').eq(-index+1).children('.lessonblock').addClass('hidden');
				bind_fn_lessonblocks();
			});
		}
	});
	
	
	var loginhandler = {
		'show.bs.modal'	: function(){
			$('#id_screen,#id_pleaseloginfirst').animate({'opacity':'0.0'},400,function(){
				$(this).css('display','none');
			});		
		},
		'hide.bs.modal'	:	function(){
			$('#id_screen,#id_pleaseloginfirst').css('display','block').animate({'opacity':'0.7'},400,function(){
			});	
		}
	}
	
	$('#modal_warning')
	.on('shown.bs.modal',function(){
		$('#modal_warning .btn-default').focus();
	});
	
	$('#nav_login').on('tap',function(){
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
	
	$('#id_pleaseloginfirst img').on('tap',function(){
		$('#nav_login').tap();
	});
	
	$('#modal_login').on(loginhandler);
	
	$('#modal_login')
	.modal('show')
	.on('shown.bs.modal',function(){
		
		$('#modal_login #id_login_email').focus();
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
						
					/* prevent user from clicking login multiple times */
					$('#modal_login .btn-success').prop('disabled',true);
					$('#modal_login .btn-success').html('Logging in ...');
					
					socket.emit('login',json,function(o){
						if(o.message=='login ok'){
							/* login ok */
							
							/* change the login button bacck to login */
							$('#modal_login .btn-success').html('Login');
							
							/* change the img of login to loading and remove the click listener */
							$('#id_pleaseloginfirst img').attr('src','includes/loading.png');
							$('#id_pleaseloginfirst').off('tap');
							
							/* hide the login modal to show loading screen */
							$('#modal_login')
							.modal('hide');
							
							$('#nav_login')
							.off('click')
							.html('<span class = "glyphicon glyphicon-log-out"></span> Logout')
							.click(function(){
								location.reload();
							});
							
							switch(o.admin){
								case 0:
									$('#id_tutormodal_hashed_id').val(o.hashed_id);
									$('#id_tutorname').prop('disabled',true);
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
							$('#modal_login .btn-success').prop('disabled',false);
							$('#modal_login .btn-success').html('Login');
							
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
		$('#modal_edit_tutor .btn-success').off('tap').on('tap',function(){
			$('#modal_edit_tutor .btn-success').prop('disabled',true);
			var json = {
				'hashed_id':$('#id_tutormodal_hashed_id').val(),
				'name':$('#id_tutormodal_name').val(),
				'mobileno':$('#id_tutormodal_mobile').val(),
				'email':$('#id_tutormodal_email').val(),
				'admin':$('#id_tutormodal_admin').val()};
				
			switch($('#modal_edit_tutor .modal-header h4').html().substring(0,3)){
				case 'Upd':
					if($('#pswd_block').hasClass('in')){
						if(socket.admin==2){
							$('#pswd_block input:not(:first-child)').each(function(){
								$(this).focus().blur();
							});
						}else{
							$('#pswd_block input').each(function(){
								$(this).focus().blur();
							});
						}
						if($('#pswd_block').children('div').hasClass('has-error')){
							return false;
						}
						if(socket.admin==2){
							json['newpswd']=$.sha256($('#id_tutormodal_newpswd').val());
						}else{
							json['oldpswd']=$.sha256($('#id_tutormodal_oldpswd').val());
							json['newpswd']=$.sha256($('#id_tutormodal_newpswd').val());
						}
					}
					socket.emit('update_existing_tutor',json,function(o){
						$('#modal_edit_tutor .btn-success').prop('disabled',false);
						switch(o){
							case 'wrong_old_pswd':
								$('#id_tutormodal_oldpswd')
								.tooltip({
									title: 'Incorrect password.'
								})
								.tooltip('show')
								.change(function(){
									$(this).tooltip('hide');
									$(this).parent().parent().removeClass('has-error');
									$(this).off('change');
								})
								.parent().parent().addClass('has-error');
							break;
							case 'same_email':
								$('#id_tutormodal_email').tooltip('show');
								$('#id_tutormodal_email').parent().parent().addClass('has-error');
							break;
							case 'update_completed':
								
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
						
						$('#modal_edit_tutor .btn-success').prop('disabled',false);
						if(o=='add_new_tutor_complete'){
							
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
		
	})
	.on('hidden.bs.modal',function(){
		$('#modal_edit_tutor .btn-success').off('tap');
		//$('#modal_edit_tutor').off('keypress');
	});
	
	window.addEventListener('popstate',function(e){
		reset_block();
		$('.modal').modal('hide');
	})
});


function tutor_lvl2_binding(){
	
	/* show buttons */
	$('#nav_students').css('display','block');
	$('#popup_addtutor').css('display','block');
	
	/* bind functions */
	tutor_lvl1_binding();
	
	/* bind add new tutor button at add class block */
	$('#popup_addtutor').on('tap',function(){
		
		history.pushState(null,null,'/');
		$('#id_tutormodal_oldpswd').prop('disabled',true);
		$('#pswd_block').removeClass('collapse');
		$('#pswd_block').css('height','153px');
		$('#modal_edit_tutor input').val('');
		$('#modal_edit_tutor').modal('show');
		$('#modal_edit_tutor .modal-title').html('Adding a new tutor');
		$('#modal_edit_tutor h4').last().html('Password');
	});
	
	/* bind tutors profile button */
	$('#nav_profiles').off('tap').tap(function(){
		history.pushState(null,null,'/');
		$('#modal_tutor').modal('show');
		$('#modal_tutor_row').empty();
		socket.emit('load_profiles','me',function(json){
		})
	});
	
	
	socket.on('append_add_new_tutor_button',function(){
		$('#modal_tutor_row').append('<div id = "id_addnewtutor" class = "col-xs-12"><button class = "col-xs-12 btn btn-default btn-lg btn-primary">Add a new tutor</button></div>');
		
		/* when add a new tutor is been added, also bind click event listeners */
		$('#modal_tutor_row .btn-primary').off('tap').on('tap',function(){
			
			history.pushState(null,null,'/');
			
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
	$('#nav_profiles').on('tap',function(){
		
		history.pushState(null,null,'/');
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
			rearrange_blocks();
			
			$(this).children('div.panel-body').children('button').off('click').click(function(){
				if($(this).parent().parent().hasClass('panel-primary')){
					/* button press, toggle noselect class */
					modal_filter_button_click($(this));
					update_lesson_blocks_tt();
				}
			});
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
		$('#id_scaffold_overlay_carousel').children('div').empty();
	});
	
	socket.on('server_to_all_tt_deleted',function(){
		/* current timetable deleted. load modal info, load the next timetable.  */
		$('#modal_warning .modal-title').html('Warning');
		$('#modal_warning .modal-body').html('Another user has deleted this timetable. You will now be transferred to another timetable.');
		$('#modal_warning').modal('show');
		socket.emit('on_document_load');
	});
	
	/* server.js will decide what is to be loaded, and what is not */
	socket.emit('on_document_load',function(o){
		socket.admin = o.admin;
		socket.name = o.name;
		if(socket.admin==2){
			var admincontrol = 
				'<div class = "form-group">'+
					'<label class = "control-label col-xs-5 col-sm-5 col-md-3" for = "id_tutormodal_admin">Admin Level:</label>'+
					'<div class = "col-xs-3 col-sm-3 col-md-2 col-lg-2">'+
						'<select class = "form-control" id = "id_tutormodal_admin">'+
							'<option>0</option>'+
							'<option>1</option>'+
							'<option>2</option>'+
						'</select>'+
					'</div>'+
					'<div class = "col-xs-offset-3 col-sm-offset-3 col-xs-9 col-sm-9 col-md-7 col-lg-7">0 - tutor<br> 1 - timetable archivist<br> 2 - skynet</div>'+
				'</div>';
			if($('#id_tutormodal_admin').length==0){
				$(admincontrol).insertAfter($('#id_admin_anchor'));
			}
		}
	});
	
	socket.on('server_to_client_rearrange_blocks',function(){
		rearrange_blocks();
		dismiss_loading();	
	});
	
	socket.on('server_to_all_update_block',function(i){
		
		//$('#'+i.hashed_id).remove(); //does not work somehow
		
		if(socket.admin==0){
			if(i.tutorname==socket.name){
				$('div').remove('#'+i.hashed_id);
				add_lesson_block(i);
				
				rearrange_blocks();
			}
		}else if(socket.admin==1||socket.admin==2){		
			$('div').remove('#'+i.hashed_id);
			add_lesson_block(i);
			
			rearrange_blocks();
		}
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
	$('#nav_rename').click(function(){
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
				
				loading();
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
	
	$('.lessonblock').addClass('hidden');
	$('#id_scaffold_overlay_carousel').children('div').eq(1).children('.lessonblock').removeClass('hidden');
	$('#id_scaffold_overlay_carousel').children('div').eq(2).children('.lessonblock').removeClass('hidden');
	
	bind_fn_creating_blocks();
	
	/* block control */
	
	socket.on('append_tutor_slot',function(o){
		if(socket.admin==0&&socket.name==o){
			$('#id_edit_block_popup #id_tutorname').append('<option id = "id_tutorname_'+o.replace(/ /g,'')+'">'+o+'</option>');
		}else if (socket.admin==1||socket.admin==2){
			$('#id_edit_block_popup #id_tutorname').append('<option id = "id_tutorname_'+o.replace(/ /g,'')+'">'+o+'</option>');			
		}
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
		$(this).prop('disabled',true);
		save_block();
	});
	
}

function tutor_lvl0_binding(){
	
	tutor_lvl1_binding();
	$('#id_navbar_ttcontrol li').css('display','none');
}

function loading(){	
	$('#id_pleaseloginfirst img').attr('src','/includes/loading.png');
	$('#id_screen_container,#id_screen,#id_pleaseloginfirst').off().css({
		'opacity'	:'0.0',
		'display'	:'block'}).animate({'opacity':'0.7'},400,function(){
	});	
}

function dismiss_loading(){
	$('#id_screen,#id_pleaseloginfirst').off().animate({'opacity':'0.0'},400,function(){
		$('#id_screen_container,#id_screen,#id_pleaseloginfirst').css('display','none');
	});	
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
	'<div class = "col-xs-7 col-sm-7 col-md-3">'+json.name+'</div>'+
	'<div class = "hidden-xs hiddem-sm visible-md-3 visible-lg-3">'+json.mobileno+'</div>'+
	'<div class = "hidden-xs hidden-sm visible-md-4 visible-lg-4">'+json.email+'</div>'+
	'<div class = "col-xs-5 col-sm-5 col-md-2"><button class = "btn btn-danger">Delete</button></div>'+
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
		
		history.pushState(null,null,'/');
		socket.emit('edit_tutor',$(this).attr('id'),function(json){
			
			/* clicking on the existing tutor slot */
			
			if(socket.admin==2){
				$('#id_tutormodal_admin').val(json[0].admin);
			}
			
			//$('#id_tutormodal_oldpswd').prop('disabled',false);
			$('#id_tutormodal_oldpswd').prop('disabled',true);
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
	
	$('div.lessonblock').each(function(){
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
	
	$('#id_button_special').insertAfter($('#panel_class').children('div.panel-body').children('button:last-child'));
	var bwrapper = $('#panel_class').children('div.panel-body');
	for (i = 2; i<bwrapper.children('button').length;i++){
		for (j=1;j<i;j++){
			var mpiece = bwrapper.children('button:nth-child('+i+')');
			var cpiece = bwrapper.children('button:nth-child('+j+')')
			var moving = Number(bwrapper.children('button:nth-child('+i+')').html().substring(1));
			var compare1 = Number(bwrapper.children('button:nth-child('+j+')').html().substring(1));
			if (j==0&&moving<compare1){
				mpiece.insertBefore(cpiece);
				continue;
			}else if (j==i-1){
				if(moving>compare1){
					mpiece.insertAfter(cpiece);
				}else if (moving<compare1){
					mpiece.insertBefore(cpiece);
				}
			}else{
				var compare2 = Number(bwrapper.children('button:nth-child('+(j+1)+')').html().substring(1));
				if(moving > compare1 && moving < compare2){
					mpiece.insertAfter(cpiece);
					continue;
				}
			}
		}
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
			'<label class = "control-label col-xs-5 col-sm-5 col-md-3" for = "id_input_modal_tt">'+i+':</label>'+
			'<div class = "col-xs-7 col-sm-7 col-md-5">'+
				'<input type = "text" data-placement="right" class = "modal-input form-control input-sm" id = "id_input_modal_tt">'+
			'</div>'+
		'</div>'+
	'</div>');
}

function populate_tt_modal(jsonO){
	for (i=0;i<Object.keys(jsonO).length;i++){
		$('#modal_tt').append('<div id ="modal_load_tt_unit_'+i+'" class = "col-xs-12 modal_load_tt_unit'+ (jsonO[i][0]==$('#nav_name').html() ? ' activett' : '' )+'"></div>');
		$('#modal_load_tt_unit_'+i)
		.append('<div class = "col-xs-7 col-sm-7 col-md-3">'+jsonO[i][0]+'</div>')
		.append('<div class = "hidden-xs hidden-sm visible-md-7 visible-lg-7">'+jsonO[i][1].split('T')[0]+'</div>')
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
		socket.emit('save_new_block',item,function(o){
			dismiss_editblock();
			$('.activeblock').removeClass('activeblock');
			$('#id_edit_block_popup .btn-success').prop('disabled',false);
		});
	}else{
		$.extend(item, {'hashed_id':$('.activeblock').attr('id')});
		socket.emit('save_existing_block',item,function(o){
			dismiss_editblock();
			$('.activeblock').removeClass('activeblock');
			$('#id_edit_block_popup .btn-success').prop('disabled',false);
		});
	}
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

	$('div.lessonblock').off();
	$('div.lessonblock:not(.hidden)').on('tap',function(){
		$('.activeblock').removeClass('activeblock');
		$(this).addClass('activeblock');
		call_editblock();
		populate_edit_block();
		return false;
	});
}

function bind_fn_creating_blocks(){
	
	//binding overlay element with on mouse down event
	$('#id_scaffold_overlay_carousel').children('div').off('tap').on('tap',function(d){
		
		$('.activeblock').removeClass('activeblock');
		$(this).append('<div class = "lessonblock activeblock newblock"></div>');
		$('div.activeblock').css({
			'top':round_off_offsetY(d.clientY-this.getBoundingClientRect().top),
			'left':0,
			'height':'32px',
			'width':'100%'
		});
		call_editblock();
		populate_edit_block();
		
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
	
	/* for mobile users */
	//$('#id_tutorname_'+$('.activeblock span.lessonblock_tutorname').html().replace(/ /g,'')).prop('selected',true);
	
	/* if there is only 1 option in select tutors, then select it. This is either because a tutor with lvl0admin is logged in, or there really is only 1 tutor in the db  */
	if($('#id_tutorname option').length==2){
		$('#id_tutorname option:last-child').prop('selected',true);
	}
}

function call_editblock(){
	
	history.pushState(null,null,'/');
	
	/* shows edit block dialogue */
	$('#id_screen_container,#id_screen').css({'display':'block','opacity':'1.0'});
	$('#id_pleaseloginfirst').css('display','none');
	
	/* jq and jqm does not support getboudingclientrect() */
	var popuptop = - document.getElementById('id_scaffold_overlay_carousel').getBoundingClientRect().top;
	
	$('#id_screen,#id_edit_block_popup').css({'display':'block','opacity':'0.0'});
	$('#id_screen').animate({'opacity':'0.7'},200);
	$('#id_edit_block_popup').animate({'opacity':'1.0'},400);
	
	/* position of the editblock will always be top,0 for mobile users */
	$('#id_edit_block_popup').css('top',popuptop);
		
	/* parsing position to time */
	var starttime = cvt_height_duration(parseInt($('.activeblock').css('top')))+7.5;
	var endtime = starttime + cvt_height_duration(parseInt($('.activeblock').css('height')));
	
	
	/* updating the parsed time to the relevant fields inside the edit block dialogue */
	$('#id_starttime').val(cvt_dec_to_time(starttime));
	$('#id_endtime').val(cvt_dec_to_time(endtime));
	
	/* updating the parsed day to the relevant field inside the edit block dialogue */
	$('#id_day_'+(Number($('.activeblock').parent().index())+1)).prop('selected',true);
	
	/* focusing on the first field inside the edit block dialogue */
	$('#id_classname').focus();
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
	$('#id_scaffold_overlay_carousel').children('div').each(function(){
		var dayblock = $(this);
		
		for (i = 2;i<dayblock.children('div:not(.noshow)').length+1;i++){
			moving = parseInt(dayblock.children('div:not(.noshow):nth-child('+i+')').css('top'));
			mpiece = dayblock.children('div:not(.noshow):nth-child('+i+')');
			for (j = 1; j<i; j++){
				compare1 = parseInt(dayblock.children('div:not(.noshow):nth-child('+j+')').css('top'));
				cpiece = dayblock.children('div:not(.noshow):nth-child('+j+')');
				if (j==1&&moving < compare1){
					mpiece.insertBefore(cpiece);
					continue;
				}else if (j==i-1){
					if(moving>=cpiece){
						mpiece.insertAfter(cpiece);
					}else if (moving<cpiece){
						mpiece.insertBefore(cpiece);
					}
				}else{
					compare2 = parseInt(dayblock.children('div:not(.noshow):nth-child('+(j+1)+')').css('top'));
					if(moving>=compare1&&moving<compare2){
						mpiece.insertAfter(cpiece);
						continue;
					}
				}
			}
		}
		
		dayblock.children('div.noshow').each(function(){
			$(this).insertAfter(dayblock.children('div').last());
		});
	});
	resize_blocks();
}

function resize_blocks(){
	$('#id_scaffold_overlay_carousel').children('div').each(function(){
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
		dayblock.children('div:not(.noshow)').css('width',90/max_concurr+'%');
	});	
	stagger_blocks();
}

function stagger_blocks(){
	$('div.lessonblock').css('left','0px');
	$('#id_scaffold_overlay_carousel').children('div').each(function(){
		var dayblock = $(this);
		var flag;
		do{
			flag = false;
			if(dayblock.children('div:not(.noshow)').length>1){
				for (i = 2;i<dayblock.children('div:not(.noshow)').length+1;i++){
					for (j=1;j<i;j++){
						
						var mpiece = dayblock.children('div:nth-child('+i+')');
						var mtop = parseInt(mpiece.css('top'));
						var mwidth = parseInt(mpiece.css('width'));
						var mleft = parseInt(mpiece.css('left'));
						
						var cpiece = dayblock.children('div:nth-child('+j+')');
						var ctop = parseInt(cpiece.css('top'));
						var cbottom = ctop + parseInt(cpiece.css('height'));
						var cleft = parseInt(cpiece.css('left'));
						
						
						if(mtop>=ctop&&mtop<cbottom&&cleft==mleft){
							flag = true;
							mpiece.css('left',mleft+mwidth);
						}
					}
				}
			}
		}while(flag);
	});
}

function cvt_day_time_to_pos_height(day, starttime, endtime){
	var pos;
	var ttop;
	var height;
	switch (day){
		case 'Mon':
			pos = $('#id_scaffold_overlay_carousel').children('div:nth-child(1)');
		break;
		case 'Tue':
			pos = $('#id_scaffold_overlay_carousel').children('div:nth-child(2)');
		break;
		case 'Wed':
			pos = $('#id_scaffold_overlay_carousel').children('div:nth-child(3)');
		break;
		case 'Thu':
			pos = $('#id_scaffold_overlay_carousel').children('div:nth-child(4)');
		break;
		case 'Fri':
			pos = $('#id_scaffold_overlay_carousel').children('div:nth-child(5)');
		break;
		case 'Sat':
			pos = $('#id_scaffold_overlay_carousel').children('div:nth-child(6)');
		break;
		case 'Sun':
			pos = $('#id_scaffold_overlay_carousel').children('div:nth-child(7)');
		break;
		default:
			pos = $('#id_scaffold_overlay_carousel').children('div:nth-child(1)');
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
	return Math.round(parseInt(i)/parseInt($('#id_table_scaffold tbody tr:nth-child(2)').css('height')))/2;
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