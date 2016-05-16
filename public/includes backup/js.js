var socket = io();

$(document).ready(function(){
	$('#test').click(function(){
		console.log('clicked');
		socket.emit('ping pong','info');
	});
	socket.on('ping pong',function(){
		console.log('client side ping received');
	});
	
	bind_fn_creating_blocks();
	
	$('#id_screen,#cancel_button').click(function(){
		reset_block();
	});
	
	$('#delete_button').click(function(){
		delete_button();
	});
});

function delete_block(){
	if($('.activeblock').hasClass('newblock')){
		$('.activeblock').remove();
	}else{
		$('.activeblock').remove();
		
		//also need to call socket to update database
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
	//the switch so that i can be either 'all', which will update all lesson blocks, or just selected lesson blocks

	$('div.lessonblock').off().on('mousedown',function(d){
		
		//in case there are other blocks with the class "activeblock"
		$('div.activeblock').removeClass('activeblock');
		$(this).addClass('activeblock');
		
		var rd = relative_offsetY(d,'.activeblock');
		var rdx = relative_offsetX(d,'.activeblock');
		
		$(document).on('mousemove',function(m){
			var rm = relative_offsetY(m,'#id_table_scaffold');
			var rmx = relative_offsetX(m,'#id_table_scaffold');
			
			if (round_off_offsetY(rm-rd)+parseInt($('.activeblock').css('height'))-1<=parseInt($('#id_table_scaffold tbody tr:last-child').position().top)+parseInt($('#id_table_scaffold tbody tr:last-child').css('height'))){
				$('.activeblock').css({
					'top': round_off_offsetY(rm-rd),
				})
			}
			
			if (Math.round(round_off_offsetX(rmx).position().left) == 0){
				console.log('horizontal movement of blocks reached left most position');
			}else if(Math.round($('.activeblock').parent().position().left)>Math.round(round_off_offsetX(rmx).position().left)){
				$('.activeblock').appendTo($('.activeblock').parent().prev());
			}else if(Math.round($('.activeblock').parent().position().left)<Math.round(round_off_offsetX(rmx).position().left)){
				$('.activeblock').appendTo($('.activeblock').parent().next());
			}
		});
		
		$(document).on('mouseup',function(){
			$(document).off('mousemove');
			$('.activeblock').removeClass('activeblock');
		});
		
		//return false to stop triggering the parent onmousedown event
		return false;
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
			
			$('div.activeblock').addClass('newblock');
			//removing active block should be called elsewhere, like when dismiss_editblock is called
			call_editblock();
			
			$(document).off('mouseup');
			$(document).off('mousemove');
		});
		
		/*
		//mouse leave doesn't seem to trigger when mouse down
		$(document).on('mouseleave',function(){
			console.log('left');
			//if the user accidentally left the viewport
			$('body').css('opacity','0.3');
			
			$(document).off('mouseleave');
		});
		*/
	});
}

function call_editblock(){
	$('#id_screen_container').css('display','block');
	if($('.activeblock').parent().index()<6){
		$('#id_edit_block_popup').removeClass().addClass('container col-sm-12 col-md-5 col-md-offset-'+($('.activeblock').parent().index()+1));
	}else if ($('.activeblock').parent().index()<8){
		$('#id_edit_block_popup').removeClass().addClass('container col-sm-12 col-md-5 col-md-offset-'+(($('.activeblock').parent().index()-6)*3+1));		
	}
	$('#id_edit_block_popup').css('top',parseInt($('.activeblock').css('top'))-20);
	if(parseInt($('#id_edit_block_popup').css('top'))+parseInt($('#id_edit_block_popup').css('height'))>parseInt($(''))+parseInt())
}

function dismiss_editblock(){
	$('#id_screen_container').css('display','none');
	$('div.activeblock').removeClass('activeblock');
	$('div.newblock').removeClass('newblock');
}

function relative_offsetY(e,r){
	return parseInt(e.pageY)-parseInt($(r).offset().top);
}

function relative_offsetX(e,r){
	return parseInt(e.pageX)-parseInt($(r).offset().left);
}

function round_off_offsetX(i){
	var o = $('#id_table_scaffold_overlay div:last-child');
	$('#id_table_scaffold_overlay div:not(:first-child)').each(function(){
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