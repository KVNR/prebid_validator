if (typeof(window.pbjs) == "object")
{
	var body = window.document.getElementsByTagName('body')[0];
	var new_div = document.createElement('div');
	new_div.setAttribute('style', 'display:none;');
	new_div.setAttribute('id', 'pbjs_data');
	new_div.setAttribute('pbjs_loaded', 'true');
	new_div.setAttribute('pbjs_object', JSON.stringify(window.pbjs));
	body.appendChild(new_div);	
}