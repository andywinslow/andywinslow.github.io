// Create minimessage factory
var msg = new gadgets.MiniMessage();
// Show a small loading message to the user
var loadMessage = msg.createStaticMessage("loading...");

// Get configured user prefs
var prefs = new gadgets.Prefs();
var showDate = prefs.getBool("show_date");
var showSummary = prefs.getBool("show_summ");
var numEntries = prefs.getInt("num_entries");

// Fetch issues when the gadget loads
gadgets.util.registerOnLoadHandler(fetchIssues);

function fetchIssues() {
  // Using Jira REST API, search for unreleased issues with a fixVersion
  var protocolHostPort = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
  var url = protocolHostPort + '/rest/api/2/search?maxResults=1000&fields=fixVersions&jql=category%20%3D%20%22Software%20Development%22%20AND%20issuetype%20!%3D%20Sub-task%20AND%20fixVersion%20is%20not%20EMPTY%20AND%20fixVersion%20not%20in%20releasedVersions()%20AND%20status%20in%20(Developing%2C%20%22Development%20Complete%22%2C%20Testing%2C%20Accepting%2C%20%22Waiting%20to%20Deploy%22)%20ORDER%20BY%20project%2C%20fixVersion';

  // Construct request parameters object
  var params = {};
  // Indicate that the response is XML
  params[gadgets.io.RequestParameters.CONTENT_TYPE] =
      gadgets.io.ContentType.DOM;

  // Proxy the request through the container server
  gadgets.io.makeRequest(url, handleResponse, params);
}

function handleResponse(obj) {
  var jsonResponse = JSON.parse(obj.text)
  // obj.data contains a Document DOM element
  // parsed from the XML that was requested

  // Process the DOM data into a JavaScript object
  var jiraIssues = {
    title : "Versions to be Released",
    items : getItems(jsonResponse)
  };
  renderJiraIssues(jiraIssues);

  msg.dismissMessage(loadMessage);
  gadgets.window.adjustHeight();
}

function getItems(jsonResponse) {
  // Items to return
  var items = [];
  var itemNodes = jsonResponse.issues;
  // Loop through all <item> nodes
  for (var i = 0; i < itemNodes.length && i < numEntries; i++) {
    var item = {};
    item.name = itemNodes[i].key;
    item.link = itemNodes[i].self;
    item.description = itemNodes[i].fields.fixVersions[0].name;
    items.push(item);
  }
  return items;
}

function isElement(node) {
  return node.nodeType == 1;
}

function renderJiraIssues(jiraIssues) {
  var html =
      "<div class='title'>" +
      jiraIssues.title +
      "</div>";
  for (var i = 0; i < jiraIssues.items.length; i++) {
    var item = jiraIssues.items[i];
    html +=
        "<div class='jira-item'>" +
        "<a target='_blank' href='" + item.link + "'>" +
        item.name +
        "</a>";
    if (showDate) {
      html +=
          "<div class='jira-item-date'>" +
          item.date +
          "</div>";
    }
    if (showSummary) {
      html +=
          "<div class='jira-item-desc'>" +
          item.desc +
          "</div>";
    }
    html += "</div>";
  }

  document.getElementById('content_div').innerHTML = html;
}