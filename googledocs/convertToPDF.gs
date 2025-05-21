// For use in Google Docs to provide an easy way to push a PDF of the document to a GitHub Repo

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Automation')
    .addItem('Convert to PDF', 'convertDocToPdf')
    .addItem('Push to GitHub', 'convertAndPushToGitHub')
    .addToUi();
}

function convertDocToPdf() {
  var doc = DocumentApp.getActiveDocument();
  var docBlob = doc.getAs('application/pdf');
  var pdfName = doc.getName() + '.pdf';

  var result = DocumentApp.getUi().alert(
    'Save As PDF?',
    'Save current document (Name: ' + doc.getName() + ') as PDF',
    DocumentApp.getUi().ButtonSet.YES_NO
  );

  if (result == DocumentApp.getUi().Button.YES) {
    // Get the document's parent folder
    var file = DriveApp.getFileById(doc.getId());
    var parentFolders = file.getParents();
    if (parentFolders.hasNext()) {
      var parentFolder = parentFolders.next();

      // Check if a file with the same name already exists in the folder
      var existingFiles = parentFolder.getFilesByName(pdfName);
      if (existingFiles.hasNext()) {
        // If file exists, get it and delete it
        var existingFile = existingFiles.next();
        existingFile.setTrashed(true); // Move the file to trash (safer than delete)
      }
      // Create the new PDF file
      parentFolder.createFile(docBlob.setName(pdfName));
    } else {
      // If no parent folder is found, create in root (fallback).
      DriveApp.createFile(docBlob.setName(pdfName));
    }
  }
}

function convertAndPushToGitHub() {
  var doc = DocumentApp.getActiveDocument();
  var docBlob = doc.getAs('application/pdf');
  var pdfName = 'resume.pdf';
  var githubRepo = 'n8petersen/googledocs-pdf-test'; // Replace with your repository
  var githubToken = getGithubToken(); // Retrieve from script properties or secure storage
  var githubFilePath = 'public/' + pdfName; // Path within your repository

  // 1. Get Blob bytes
  var bytes = docBlob.getBytes();
  var base64Content = Utilities.base64Encode(bytes);

  // 2. Push to GitHub using GitHub API
  pushFileToGithub(githubRepo, githubFilePath, githubToken, base64Content, pdfName);
}

function pushFileToGithub(repo, path, token, content, fileName, branch) {
  var url = 'https://api.github.com/repos/' + repo + '/contents/' + path;
  var message = 'Add ' + fileName + ' via Google Apps Script'; // Commit message

  // First check if the file exists to get the sha
  var options = {
    method: 'get',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    muteHttpExceptions: true,
  };

  var response = UrlFetchApp.fetch(url, options);
  var jsonResponse = JSON.parse(response.getContentText());
  var sha = null;
  if (response.getResponseCode() == 200) {
    sha = jsonResponse.sha;
  }
  var payload = {
    message: message,
    content: content,
    branch: branch,
  };
  if (sha) {
    payload.sha = sha;
  }


  options = {
    method: 'put',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  response = UrlFetchApp.fetch(url, options);
  jsonResponse = JSON.parse(response.getContentText());
  if (response.getResponseCode() == 200 || response.getResponseCode() == 201) {
    Logger.log('PDF pushed to GitHub successfully: ' + jsonResponse.content.html_url);
    DocumentApp.getUi().alert('Success', 'PDF pushed to GitHub successfully!', DocumentApp.getUi().ButtonSet.OK);
  } else {
    Logger.log('Error pushing to GitHub:' + response.getResponseCode() + ': ' + response.getContentText());
    DocumentApp.getUi().alert('Error', 'Error pushing to GitHub: ' + response.getResponseCode() + ': ' + response.getContentText(), DocumentApp.getUi().ButtonSet.OK);

  }
}

function getGithubToken() {
  // For better security, use PropertiesService to store the token and retrieve it
  // Encrypt the token if needed
  var scriptProperties = PropertiesService.getScriptProperties();
  var githubToken = scriptProperties.getProperty('githubToken');

  if (!githubToken) {
    githubToken = DocumentApp.getUi().prompt('GitHub Token', 'Enter your GitHub Personal Access Token:', DocumentApp.getUi().ButtonSet.OK_CANCEL)
    if (githubToken.getSelectedButton() == DocumentApp.getUi().Button.OK) {
      scriptProperties.setProperty('githubToken', githubToken.getResponseText());
      return githubToken.getResponseText();
    }
    else {
      return null;
    }
  }
  return githubToken;
}