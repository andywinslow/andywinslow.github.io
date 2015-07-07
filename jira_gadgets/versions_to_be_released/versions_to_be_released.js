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
  // parsed from the JSON that was requested

  renderJiraIssues(getIssues(jsonResponse));

  msg.dismissMessage(loadMessage);
  gadgets.window.adjustHeight();
}

function getIssues(jsonResponse) {
  // Items to return
  var versions = [];
  var issues = jsonResponse.issues;
  // Loop through all <item> nodes
  for (var i = 0; i < issues.length && i < numEntries; i++) {
    var version = {};
    version.version = issues[i].fields.fixVersions[0].name;
    version.releaseDate = issues[i].fields.fixVersions[0].releaseDate;
    versions.push(version);
  }
  return versions;
}

function isElement(node) {
  return node.nodeType == 1;
}

function renderJiraIssues(jiraIssues) {
  var html = "<table><thead><tr><th>Version</th><th>Release Date</th></tr></thead>";
  for (var i = 0; i < jiraIssues.length; i++) {
    var issue = jiraIssues[i];
    html += "<tr><td>" + issue.version + "</td><td>" + issue.releaseDate +"</td></tr>";
  }
  html += "</table>"

  document.getElementById('content_div').innerHTML = html;
}