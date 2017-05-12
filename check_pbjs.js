if (typeof(window.pbjs) == "object")
{
	var body = window.document.getElementsByTagName('body')[0];
	var new_div = document.createElement('div');
	new_div.setAttribute('style', 'display:none;');
	new_div.setAttribute('id', 'pbjs_data');
	new_div.setAttribute('pbjs_loaded', 'true');
	new_div.setAttribute('pbjs_object', JSON.stringify(window.pbjs));
	body.appendChild(new_div);


    window.pbjs_debug = function(msg) {
        console.log("%c PBJS Debug " + "%c "+msg, "background:#9dbff3", "color: blue");
    };

    window.pbjs_debug('Logging PBJS events for '+location.href);
    pbjs.que.push(function() {
        pbjs.onEvent('auctionInit', function() { window.pbjs_debug('Auction started ==================================='); });
        pbjs.onEvent('requestBids', function() { window.pbjs_debug('Bids Requested'); });
        pbjs.onEvent('bidRequested', function(data) { var divs = "";for(var i=0;i<data.bids.length;i++){var sizes = "";for(var j=0;j<data.bids[i].sizes.length;j++){sizes += data.bids[i].sizes[j][0] +"x"+ data.bids[i].sizes[j][1] + "   ";}divs +="\n               "+data.bids[i].placementCode + "    "+sizes;}window.pbjs_debug('> Bid Requested from ' +data.bidderCode+ ' for the following: ' + divs); });
        pbjs.onEvent('bidResponse', function(data) { window.pbjs_debug('> Bid Returned from '+data.bidderCode+':\n\n'+JSON.stringify(data, null, 4)); });
        pbjs.onEvent('bidTimeout', function() { window.pbjs_debug('> Bid Timeout occurred'); });
        pbjs.onEvent('bidAdjustment', function() { window.pbjs_debug('> Bid Adjustment occurred'); });
        pbjs.onEvent('bidWon', function(data) { window.pbjs_debug('A Bid won the DFP auction\n\n'+JSON.stringify(data, null, 4)); });
        pbjs.onEvent('auctionEnd', function() { window.pbjs_debug('Auction ended ======================================\n\n'+JSON.stringify(pbjs.getBidResponses(), null, 4)); });
        pbjs.onEvent('setTargeting', function() { window.pbjs_debug('Setting DFP targeting:\n\n'+JSON.stringify(pbjs.getAdserverTargeting(), null, 4)); });
    });	
}

/*
var body_node = document.getElementsByTagName('body')[0];

body_node.onload = function()
{

	var pbjs_debug_dfp = [];
	var ad_slots = window.googletag.pubads().getSlots();

	for (var i=0; i < ad_slots.length; i++)
	{
	    var div = window.googletag.pubads().getSlots()[i.toString()].getSlotElementId();
	    try { var kvs = window.googletag.pubads().getSlots()[i.toString()].ca.v.o; }
	    catch(e) { var kvs = {}; }

	    var obj = {div: div, key_values: kvs};
	    pbjs_debug_dfp.push(obj);
	    console.log(JSON.stringify(obj, null, 4));
	}

};
*/

