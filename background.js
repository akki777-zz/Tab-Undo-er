var removedTabId, removedUrl, undoUrl, lastRemovedId = 0;

chrome.browserAction.onClicked.addListener(function (tab) {
	call();
});

chrome.runtime.onStartup.addListener(function () {
	chrome.storage.sync.clear();
});

chrome.commands.onCommand.addListener(function (command) {
	//console.log("Command " + command);
	call();
});

chrome.tabs.onCreated.addListener(function (tab) {
	//console.log("***onCreated*** " + tab.id);
	var id = tab.id;
	var url = tab.url;
	chrome.storage.sync.get(function (result) {
		if (typeof result["data"] !== 'undefined' && result["data"] instanceof Array) {
			result["data"].push({
				"id": id,
				"url": url
			});
		} else {
			console.log("in else" + id + url);
			result["data"] = [];
			result["data"].push({
				"id": id,
				"url": url
			});
		}
		chrome.storage.sync.set(result, function () { });
	});
});


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	//console.log("***onUpdated*** Tabid = " + tabId.toString() + " Url = " + tab.url + " Tab position = " + tab.index);
	editJson(tabId, tabId, tab.url);
});
chrome.tabs.onReplaced.addListener(function (newTabId, oldtabId) {
	//console.log("***onReplaced*** " + newTabId + "<--" + oldtabId);
	chrome.tabs.get(newTabId, function (tab) {
		removedUrl = tab.url;
		//console.log("Removed Url : " + removedUrl);
		editJson(newTabId, oldtabId, removedUrl);
	});
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
	console.log("***onRemoved*** " + tabId);
	if (typeof removedTabId !== "undefined")
	{ lastRemovedId = removedTabId; }
	removedTabId = tabId;
	console.log("Last Removed " + lastRemovedId + "Recently removed " + removedTabId);
	optimise();
});

function editJson(newId, oldId, link) {

	//console.log("EditJSon " + oldId + link);
	chrome.storage.sync.get(function (result) {
		var url = JSON.stringify(result);
		var json = JSON.parse(url);
		for (var i = 0; i < json["data"].length; i++) {
			if (json["data"][i].id == oldId) {
				//console.log("i = " + i);
				json["data"][i].id = newId;
				json["data"][i].url = link;
				chrome.storage.sync.set(json, function () { });
				break;
			}
		}
	});
}

/*chrome.storage.onChanged.addListener(function (changes, sync) {
	for (key in changes) {
		console.log(JSON.stringify(changes[key].oldValue) + "-->" + JSON.stringify(changes[key].newValue));
	}
})*/

function call() {
	console.log("CALL : " + lastRemovedId);
	console.log("Working" + " Removed id = " + removedTabId);
	chrome.storage.sync.get(function (result) {
		var url = JSON.stringify(result);
		var json = JSON.parse(url);
		//removedUrl = json["url"].toString();
		for (var i = 0; i < json["data"].length; i++) {
			if (json["data"][i].id == removedTabId) {
				undoUrl = json["data"][i].url;
				break;
			}

		}
		//console.log("Storage Result : " + json["data"].length);
		console.log(url);
		chrome.tabs.create({ 'url': undoUrl, 'active': true });
	});

}

function optimise() {
	chrome.storage.sync.get(function (result) {
		var url = JSON.stringify(result);
		var json = JSON.parse(url);
		for (var i = 0; i < json["data"].length; i++) {
			if (json["data"][i].id == lastRemovedId) {
				console.log(json["data"][i].url);
				json["data"].splice([i], 1);
				chrome.storage.sync.set(json, function () { });
				break;
			}
		}
	});
}
