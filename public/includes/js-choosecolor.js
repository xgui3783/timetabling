
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