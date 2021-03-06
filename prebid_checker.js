// Helper creating new div
function addCallInfoDiv(details, call_type)
{
		// Add data
		var data_div = document.getElementById('data');

		var new_div = document.createElement('div');
		new_div.id = Date.now();
		new_div.setAttribute('style', 'display:none');

		var data = {};
		data.tab_id = details.tabId;
		data.url = details.url;
		data.datetime = Date.now();
		data.status_code = details.statusCode;
		data.qs_parameters = getQueryParams(details.url);
		data.call_type = call_type;

		new_div.innerHTML = JSON.stringify(data);

		data_div.appendChild(new_div);
}


// Tab calls filter
chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
	var current_tab = tabs[0];
	// Get dom info

	chrome.tabs.reload(current_tab.id);
	countDFPAdSlotsOnPage(current_tab.id);

	// Prebid.js load check
	checkHeaderBiddingWrapperOnPage(current_tab.id);

	// JPT calls check
	chrome.webRequest.onResponseStarted.addListener(
		function(details) {
	    	if (details.statusCode == 200 && current_tab.id == details.tabId)
	    	{
	    		addCallInfoDiv(details, 'jpt');
	    	}
	   	},
	    {urls: ["*://*.adnxs.com/jpt*"]},
	    ["responseHeaders"]
	);

	// UT call check
	chrome.webRequest.onBeforeRequest.addListener(
		function(details) {
			if (current_tab.id == details.tabId)
			{
				addCallInfoDiv(details, 'ut');
			}
	   	},
	    {urls: ["*://*.adnxs.com/ut/*/prebid*"]},
	    ["requestBody"]
	);

	// PBS call check
	chrome.webRequest.onBeforeRequest.addListener(
		function(details) {
			if (current_tab.id == details.tabId)
			{
				addCallInfoDiv(details, 'pbs');
			}
	   	},
	    {urls: ["*://*.adnxs.com/pbs/*/auction"]},
	    ["requestBody"]
	);	

	// GPT calls check
	chrome.webRequest.onResponseStarted.addListener(
		function(details) {
	    	if (details.statusCode == 200 && current_tab.id == details.tabId)
	    	{
	    		addCallInfoDiv(details, 'gpt');
	    	}
	   	},
	   	{urls: ["*://*.g.doubleclick.net/gampad/ads*"]},
	    ["responseHeaders"]
	);

	// AB calls check
	chrome.webRequest.onResponseStarted.addListener(
		function(details) {
	    	if (details.statusCode == 200 && current_tab.id == details.tabId)
	    	{
	    		addCallInfoDiv(details, 'ab');
	    	}
	   	},
	    {urls: ["*://*.adnxs.com/ab*"]},
	    ["responseHeaders"]
	);

	// CND calls check
	chrome.webRequest.onResponseStarted.addListener(
		function(details) {
	    	if (details.statusCode == 200 && current_tab.id == details.tabId)
	    	{
	    		addCallInfoDiv(details, 'cdn');
	    	}
	   	},
	    {urls: ["*://cdn.adnxs.com/p/*", "*://vcdn.adnxs.com/p/*", "*://*/appnexus.download.akamai.com/*.png"]},
	    ["responseHeaders"]
	);  
});

// Helper for query string parameters
function getQueryParams(qs)
{
	qs = /[?](.+)/.exec(qs);
	qs = qs ? qs[1].split('+').join(' ') : '';

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params ? params : {};
}

// Helper showing message
function showMessage(message, type)
{
	var content_div = document.getElementById('plugin_content');

	var new_p = document.createElement('p');
	var classes = 'message ' + type;
	new_p.setAttribute('class', classes);


	new_p.innerHTML = message;

	content_div.appendChild(new_p);	
}

// Helper callback to retreive DOM content from active tab
function writeCountDFPAdSlotsOnPage(tab_dom_content)
{
	google_tags_count = 0;

	var google_tags_count = (tab_dom_content.match(/googletag\.defineSlot/g) || []).length;
	document.getElementById('data').setAttribute('dfp_tags',google_tags_count);
}

// Helper for number of adslots on page
function countDFPAdSlotsOnPage(tab_id)
{
	chrome.tabs.sendMessage(tab_id, {text:'Give me the DOM!'}, writeCountDFPAdSlotsOnPage);
}

// Helper collecting data in div
function collectData()
{
	var data = [];
	var parent = document.getElementById('data');
	var children = parent.getElementsByTagName('*');

	for (i = 0; i < children.length; ++i)
	{
		var content = JSON.parse(children[i].innerHTML);
		data.push(content);
	}

	return data;
}

// Helper callback to retreive pbjs from active tab
function writeHeaderBiddingWrapperDataOnExtension(response)
{
	//console.log(response);
	response = response.replace(/&quot;/g,'"');

	var pbjs = pbjs = '{}'
	if (response.includes('pbjs_object="'))
	{
		pbjs = response.split('pbjs_object="')[1];
		pbjs = pbjs.split('"></div>')[0];
	}
	document.getElementById('data').setAttribute('pbjs_object',pbjs);


	// Check for competitor wrappers
	competitors = ['openx', 'index', 'rubicon', 'amazon'];

	competitors.forEach(function(element) {

		var competitor = {}
		competitor.name = element;

		if (response.includes('id="' + competitor.name + '_data'))
		{
			version = response.split(competitor.name + '_version="')[1];
			version = version.split('"></div>')[0];
			competitor.version = version;
			document.getElementById('data').setAttribute(competitor.name + '_object',JSON.stringify(competitor));
		}
	});
}

// Send a message to the page, retrieve pbjs and send it back serialized
function checkHeaderBiddingWrapperOnPage(tab_id)
{
	chrome.tabs.sendMessage(tab_id, {text:'Give me the DOM!'}, writeHeaderBiddingWrapperDataOnExtension);
}

// Check if prebid loaded properly
function checkPrebidLoaded()
{

	var pbjs = document.getElementById('data').getAttribute('pbjs_object');

	try 
	{
		pbjs = JSON.parse(pbjs);
	}
	catch (e)
	{
		console.log(e);
		pbjs = {}
	}

	console.log(pbjs);

	var message = '';
	type = '';

	if (!pbjs.libLoaded)
	{
		message += 'Error : Prebid library not loaded.<br/>';

		competitors = ['openx', 'index', 'rubicon', 'amazon'];

		competitors.forEach(function(element) {

			var competitor = document.getElementById('data').getAttribute(element + '_object');
			if (competitor)
			{
				competitor = JSON.parse(competitor);
				message += ' - ' + competitor.name + ' wrapper'
				message += competitor.version ? ' version ' + competitor.version : '';
				message += ' is used.<br/>';	
			}
		});

		type = 'ko';
	}
	else
	{
		type = 'ok'
		message += 'Prebid library loaded: OK!<br/>';
		message += ' - Prebid ' + pbjs.version + '<br/>';
		message += ' - '+ pbjs.adUnits.length + ' adUnits<br/>';
		if (pbjs.bidderTimeout) { message += ' - Timeout of '+ pbjs.bidderTimeout +' ms<br/>';};

		var ad_unit = null;
		for (i=0; i < pbjs.adUnits.length; i++)
		{
			adunit = pbjs.adUnits[i];

			message += '<br/>';
			message += 'adUnit ' + (i+1) + ':<br/>';
			message += ' - Code: '+ adunit.code + '<br/>';

			var sizes = '';

			adunit_sizes = adunit.sizes ? adunit.sizes : adunit.bids[0].sizes;

			for (j=0; adunit_sizes && j < adunit_sizes.length; j++)
			{
				sizes += ' ' + adunit_sizes[j][0] +'x'+ adunit_sizes[j][1];
			}		
			message += ' - Sizes:'+ sizes + '<br/>';

			var bidders = '';
			for (j=0; j < adunit.bids.length; j++)
			{
				bidders += ' ' + adunit.bids[j].bidder;
			}
			message += ' - Bidders:'+ bidders + '<br/>';
			message += ' - Transaction Id: '+ adunit.transactionId + '<br/>';
		}
	}
	showMessage(message,type);
	return type == 'ok' ? 0 : 1;
}

// Check jpt calls
function checkJptCalls(data)
{
	if (!data.length || data[0].call_type == 'ut' || data[0].call_type == 'pbs')
	{
		return 0;
	}
		
	var max_time = 0;
	var jpt_count = 0;

	var error_counter = 0;
	var warning_counter = 0;
	var qs_parameters = [];
	var tab_id = data[0].tab_id;
	var message = '';

	if (!data.length || data[0].call_type != 'jpt')
	{
		error_counter++;
		message += 'Error : JPT call is missing.<br/>';	
	}	

	for (i = 0; i < data.length; ++i) {

		if (data[i].call_type == 'jpt')
		{
			jpt_count++;
			max_time = data[i].datetime > max_time ? data[i].datetime : max_time;
			qs_parameters = data[i].qs_parameters;

			// check callback
			if (qs_parameters.callback != 'pbjs.handleAnCB')
			{
				error_counter++;
				message += 'Error : placement '+  qs_parameters.id + '. Wrong callback parameter in jpt call.<br/>';
			}

			// check size
			allowed_sizes = ['300x250','728x90','300x600','320x50','160x600','970x25','970x250','1800x1000'];
			if (!allowed_sizes.includes(qs_parameters.size))
			{
				error_counter++;
				message += 'Error : placement '+  qs_parameters.id + '. Wrong size parameter. Please use one of '+ allowed_sizes.toString() +'<br/>';
			}

			// check referrer
			if (!qs_parameters.referrer.length || !qs_parameters.referrer)
			{
				error_counter++;
				message += 'Error : placement '+  qs_parameters.id + '. Refferer parameter is missing.<br/>';
			}
		}
	}

	// Check if number of JPT calls equals number of google tags on page
	var google_tags_count = 0;
	google_tags_count = document.getElementById('data').getAttribute('dfp_tags');
	if (jpt_count != google_tags_count)
	{
		error_counter++;
		message += 'Error : number of JPT calls ('+jpt_count+') is not the same as the number of google tags ('+google_tags_count+').<br/>';		
	}

	document.getElementById('data').setAttribute('jpt_calls',jpt_count);

	message = !error_counter ? 'JPT calls: OK!<br/>' : message;
	var type = error_counter ? 'ko' : 'ok';
	showMessage(message, type);
	return error_counter;
}

// Check number of AdSlots on page
function checkAdSlotCount()
{
	var error_counter = 0;
	var message = '';
	var google_tags_count = document.getElementById('data').getAttribute('dfp_tags');

	if (google_tags_count < 1)
	{
		error_counter++;
		message = 'Error : You should have at least 2 ad slots on the page.<br/>';
	}
	else
	{
		message = 'Number of ad slots on page: OK!<br/>';
	}

	var type = error_counter ? 'ko' : 'ok';
	showMessage(message, type);
	return error_counter;
}

// Check gpt calls
function checkGptCalls(data)
{
	var max_time = 0;
	var min_time = null;
	var gpt_count = 0;
	var error_counter = 0;
	var warning_counter = 0;
	var current_price_bucket = 0;
	var price_bucket_counter = 0;
	var qs_parameters = [];
	var tab_id = data[0].tab_id;
	var message = '';
	var hb_params = {};
	var scp_params = '';
	var jpt_count = document.getElementById('data').getAttribute('jpt_calls');
	var pbs_count = document.getElementById('data').getAttribute('pbs_calls');
	var adaptor_name = jpt_count || pbs_count ? 'appnexus' : 'appnexusAst';
	var good_adaptor = true;
	var allowed_sizes = ['300x250','728x90','300x600','320x50','160x600','970x25','970x250','1800x1000'];
	var good_sizes = true;
	var scp_params_list = [];

	for (i = 0; i < data.length; ++i)
	{
		if (data[i].call_type == 'gpt')
		{
			console.log(data[i].call_type);
			gpt_count++;
			max_time = data[i].datetime > max_time ? data[i].datetime : max_time;
			min_time = !min_time || data[i].datetime < max_time ? data[i].datetime : min_time;
			qs_parameters = data[i].qs_parameters;

			if (qs_parameters.scp)
			{
				scp_params_list = [qs_parameters.scp.replace(/&amp/g, '')];
			}
			else if (qs_parameters.prev_scp)
			{
				scp_params_list = qs_parameters.prev_scp.replace(/&amp/g, '').split('|');
			}

			for (j = 0; j < scp_params_list.length; j++)
			{
				scp_params = scp_params_list[j].split(';');
				for (k = 0; k < scp_params.length; ++k)
				{
					scp_param = scp_params[k].split('=');
					hb_params[scp_param[0]] = scp_param[1];

					// Count number of price buckets
					if (scp_param[0] == 'hb_pb' || scp_param[0] == 'hb_pb_appnexus' && current_price_bucket != scp_param[1])
					{
						current_price_bucket = scp_param[1];
						price_bucket_counter++;
					}

					// Check adaptator name
					if (scp_param[0] == 'hb_bidder' && (jpt_count || pbs_count))
					{
						good_adaptor = good_adaptor && scp_param[1] == 'appnexus';
					}
					else if (scp_param[0] == 'hb_bidder' && !jpt_count && !pbs_count)
					{
						good_adaptor = good_adaptor && scp_param[1] == 'appnexusAst';
					}

					// Check size parameter
					good_sizes = scp_param[0] == 'hb_size' && !allowed_sizes.includes(scp_param[1]) ? false : good_sizes;
				}					
			}			
		}
	}

	document.getElementById('data').setAttribute('price_buckets',price_bucket_counter);
	if (price_bucket_counter < 2)
	{
		error_counter++;
		message += 'Error : you should use at least 2 different price buckets.<br/>';		
	}

	if (!good_adaptor)
	{
		error_counter++;
		message += 'Error : in GTP call, wrong value for parameter hb_bidder. Value should be '+adaptor_name+'.<br/>';		
	}

	if (!good_sizes)
	{
		error_counter++;
		message += 'Error : in GTP call, wrong value for parameter hb_size. Value should be one of '+ allowed_sizes.toString() +'<br/>';		
	}	

	var gtp_prebid_placements_count = qs_parameters.scp ? gpt_count : scp_params_list.length;
	document.getElementById('data').setAttribute('gpt_prebid_placements',gtp_prebid_placements_count);
	var google_tags_count = 0;
	google_tags_count = document.getElementById('data').getAttribute('dfp_tags');
	if (qs_parameters.scp && gpt_count != google_tags_count)
	{
		error_counter++;
		message += 'Error : number of GPT calls ('+gpt_count+') is not the same as the number of google tags ('+google_tags_count+').<br/>';		
	}

	if (qs_parameters.prev_scp && scp_params_list.length != google_tags_count)
	{
		error_counter++;
		message += 'Error : GPT call is providing prebid parameters for '+scp_params_list.length+' ad slots. This number is not the same as the number of google tags ('+google_tags_count+').<br/>';		
	}	

	if (qs_parameters.scp && data[1].call_type == 'jpt'&& gpt_count != jpt_count)
	{
		error_counter++;
		message += 'Error : number of GPT calls ('+gpt_count+') is not the same as the number of JPT calls ('+jpt_count+').<br/>';		
	}

	if (qs_parameters.prev_scp && data[1].call_type == 'jpt' && scp_params_list.length != jpt_count)
	{
		error_counter++;
		message += 'Error : GPT call is providing prebid parameters for '+scp_params_list.length+' ad slots. This number is not the same as the number of JPT calls ('+jpt_count+').<br/>';		
	}		

	message = !error_counter ? 'GPT calls: OK!<br/>' : message;
	var type = error_counter ? 'ko' : 'ok';
	showMessage(message, type);
	return error_counter;
}

// Check AB calls
function checkAbCalls(data)
{
	if (!data.length || data[0].call_type == 'ut')
	{
		return 0;
	}

	var ab_count = 0;
	var max_time = 0;
	var min_time = null;
	var jpt_count = document.getElementById('data').getAttribute('jpt_calls');
	var gpt_count = document.getElementById('data').getAttribute('gpt_prebid_placements');
	var message = '';
	var error_counter = 0;

	for (i = 0; i < data.length; ++i)
	{
		if (data[i].call_type == 'ab')
		{
			console.log(data[i].call_type);
			ab_count++;
			max_time = data[i].datetime > max_time ? data[i].datetime : max_time;
			min_time = !min_time || data[i].datetime < max_time ? data[i].datetime : min_time;
			qs_parameters = data[i].qs_parameters;
		}
	}

	document.getElementById('data').setAttribute('ab_calls',ab_count);
	var google_tags_count = 0;
	google_tags_count = document.getElementById('data').getAttribute('dfp_tags');
	if (ab_count != google_tags_count)
	{
		error_counter++;
		message += 'Error : number of AB calls ('+ab_count+') is not the same as the number of google tags ('+google_tags_count+').<br/>';		
	}

	if (ab_count != jpt_count && data[0].call_type == 'jpt')
	{
		error_counter++;
		message += 'Error : number of AB calls ('+ab_count+') is not the same as the number of JPT calls ('+jpt_count+').<br/>';		
	}

	if (ab_count != gpt_count)
	{
		error_counter++;
		message += 'Error : number of AB calls ('+ab_count+') is not the same as the number of ad slots in GPT ('+gpt_count+').<br/>';		
	}

	message = !error_counter ? 'AB calls: OK!<br/>' : message;
	var type = error_counter ? 'ko' : 'ok';
	showMessage(message, type);
	return error_counter;
}

// Check UT calls
function checkUtCalls(data)
{
	if (data.length && (data[0].call_type == 'jpt' || data[0].call_type == 'pbs'))
	{
		return 0;
	}

	var message = '';

	if (!data.length || data[0].call_type != 'ut')
	{
		error_counter++;
		message += 'Error : UT call is missing.<br/>';	
	}

	var error_counter = 0;
	var ut_count = 0;
	
	for (i = 0; i < data.length; ++i)
	{
		if (data[i].call_type == 'ut')
		{
			console.log(data[i].call_type);
			ut_count++;
		}
	}

	if (ut_count > 1)
	{
		error_counter++;
		message += 'Error : number of UT calls ('+ut_count+') is too big. You should have only 1.<br/>';		
	}

	message = !error_counter ? 'UT calls: OK!<br/>' : message;
	var type = error_counter ? 'ko' : 'ok';
	showMessage(message, type);
	return error_counter;	
}

// Check PBS calls
function checkPbsCalls(data)
{
	if (data.length && (data[0].call_type == 'jpt' || data[0].call_type == 'ut'))
	{
		return 0;
	}

	var message = '';

	if (!data.length || data[0].call_type != 'pbs')
	{
		error_counter++;
		message += 'Error : PBS call is missing.<br/>';	
	}

	var error_counter = 0;
	var pbs_count = 0;
	
	for (i = 0; i < data.length; ++i)
	{
		if (data[i].call_type == 'pbs')
		{
			console.log(data[i].call_type);
			pbs_count++;
		}
	}

	document.getElementById('data').setAttribute('pbs_calls',pbs_count);

	if (pbs_count > 1)
	{
		error_counter++;
		message += 'Error : number of PBS calls ('+pbs_count+') is too big. You should have only 1.<br/>';		
	}

	message = !error_counter ? 'PBS calls: OK!<br/>' : message;
	var type = error_counter ? 'ko' : 'ok';
	showMessage(message, type);
	return error_counter;	
}

// Check CDN calls
function checkCdnCalls(data)
{
	var cdn_count = 0;
	var max_time = 0;
	var min_time = null;
	var jpt_count = document.getElementById('data').getAttribute('jpt_calls');
	var gpt_count = document.getElementById('data').getAttribute('gpt_prebid_placements');
	var message = '';
	var error_counter = 0;

	for (i = 0; i < data.length; i++)
	{
		if (data[i].call_type == 'cdn')
		{
			console.log(data[i].call_type);
			cdn_count++;
			max_time = data[i].datetime > max_time ? data[i].datetime : max_time;
			min_time = !min_time || data[i].datetime < max_time ? data[i].datetime : min_time;
			qs_parameters = data[i].qs_parameters;
		}
	}

	document.getElementById('data').setAttribute('cdn_calls',cdn_count);
	var google_tags_count = 0;
	google_tags_count = document.getElementById('data').getAttribute('dfp_tags');
	if (cdn_count != google_tags_count)
	{
		error_counter++;
		message += 'Error : number of creatives delivered ('+cdn_count+') is not the same as the number of google tags ('+google_tags_count+').<br/>';		
	}

	if (cdn_count != gpt_count)
	{
		error_counter++;
		message += 'Error : number of creatives delivered ('+cdn_count+') is not the same as the number of ad slots in GPT ('+gpt_count+').<br/>';		
	}

	message = !error_counter ? 'Creatives delivered: OK!<br/>' : message;
	var type = error_counter ? 'ko' : 'ok';
	showMessage(message, type);
	return error_counter;
}

// Main
chrome.tabs.onUpdated.addListener(function(tab_id , info)
{
    if (info.status == "complete")
    {
    	setTimeout(function(){
			console.log('start');
			
			var ok_counter = 0;
			var data = collectData();
			var message = '';

			document.getElementById("processing").remove();
			
			ok_counter += !checkPrebidLoaded();
			if (ok_counter)
			{
				ok_counter += !checkAdSlotCount();
				ok_counter += !checkUtCalls(data);
				ok_counter += !checkPbsCalls(data);
				ok_counter += !checkJptCalls(data);
				ok_counter += !checkGptCalls(data);
				ok_counter += !checkAbCalls(data);
				ok_counter += !checkCdnCalls(data);
			}

			if (ok_counter == 8)
			{
				message = 'Prebid Test Page validated!<br/> You are all set :)<br/>';
				type = 'ok';
			}
			else
			{
				var error_counter = 8 - ok_counter;
				message += error_counter;
				message += error_counter > 1 ? ' steps are' : ' step is';
				message +=' KO. Please fix the test page.<br/>';
				type ='ko';
			}

			showMessage(message, type);

			console.log('end');
		},2000);
    }
});
