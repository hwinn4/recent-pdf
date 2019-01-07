/** Script.js
 *
 * Contains the main program logic for recent-pdf
 *  - loads pdf files from downloads api
 */

let localPdfCount = 0;
let onlineCount = 0;
let savedPdfCount = 0;

let onlineList = document.getElementById("link-list"); // online file list
let fileElement = document.getElementById("file-list"); // offline (local) file list
let savedList = document.getElementById("saved-list"); // saved file list (from chrome storage)

loadSettings(); // load the user settings
searchHistory();

function searchHistory() {
  chrome.history.search(
    {
      text: ".pdf",
      maxResults: 10000
    },
    function(data) {
      data.forEach(function(page) {
        if (page.url.endsWith(".pdf")) {
          // check if page is a .pdf
          let listItem = document.createElement("li");
          listItem.classList.add("list-item");

          if (!page.url.startsWith("file:")) {
            onlineCount++;

            let saveDiv = document.createElement("div");
            let leftDiv = document.createElement("div");
            let rightDiv = document.createElement("div");
            saveDiv.classList.add("list-div", "left");
            leftDiv.classList.add("list-div", "left");
            rightDiv.classList.add("list-div", "right");

            let title = document.createElement("p");
            title.classList.add("link-title");
            title.innerText = onlinePdfTitle(page.url);
            let linkUrl = document.createElement("p");
            linkUrl.classList.add("link-url");
            linkUrl.innerHTML = onlineDisplayPath(page.url);

            let icon = document.createElement("img");
            icon.classList.add("link-thumb");
            icon.src = `chrome://favicon/${page.url}`;

            let save = document.createElement("p");
            save.classList.add("save-link");
            save.dataset.title = onlinePdfTitle(page.url);
            save.dataset.url = page.url;
            save.innerText = "save!";

            saveDiv.appendChild(save);
            leftDiv.appendChild(icon);
            leftDiv.appendChild(title);
            leftDiv.appendChild(linkUrl);

            leftDiv.addEventListener("click", function() {
              window.open(page.url);
            });

            saveDiv.addEventListener("click", function(e) {
              saveOnlinePdf(e);
            });

            listItem.appendChild(saveDiv);
            listItem.appendChild(leftDiv);
            listItem.appendChild(rightDiv);
            onlineList.appendChild(listItem);
          }
        }
      });
      footer(onlineCount, "online");
      searchDownloads();
      console.log(`${onlineCount} online PDFs found.`);
    }
  );
}

function onlinePdfTitle(url) {
  var decodedUri = decodeURI(url);
  var startIdx = url.lastIndexOf("/") + 1;
  var endIdx = url.length - 4;

  return decodedUri.substring(startIdx, endIdx);
}

function localPdfTitle(filename) {
  var startIdx = filename.lastIndexOf("\\") + 1;
  var endIdx = filename.length - 4;
  return filename.substring(startIdx, endIdx);
}

function localDisplayPath(filename) {
  return filename.substring(0, 50);
}

let localFiles = [];

function searchDownloads() {
  chrome.downloads.search(
    {
      limit: 1000,
      orderBy: ["-startTime"]
    },
    function(data) {
      data.forEach(function(file, i) {
        if (file.filename.endsWith(".pdf")) {
          if (!localFiles.includes(file.filename) && localPdfCount < 30) {
            localFiles.push(file.filename);
            localPdfCount++;

            let saveDiv = document.createElement("div");
            let leftDiv = document.createElement("div");
            let rightDiv = document.createElement("div");
            saveDiv.classList.add("list-div", "left");
            leftDiv.classList.add("list-div", "left");
            rightDiv.classList.add("list-div", "right");

            let fileItem = document.createElement("li");
            fileItem.classList.add("list-item", "file-item");

            let icon = document.createElement("img");
            icon.classList.add("link-thumb");
            chrome.downloads.getFileIcon(
              file.id,
              {
                size: 16
              },
              function(iconUrl) {
                icon.src = iconUrl;
              }
            );

            let title = document.createElement("p");
            title.classList.add("link-title");
            title.classList.add("local-title");
            title.innerText = localPdfTitle(file.filename);

            let linkUrl = document.createElement("p");
            linkUrl.classList.add("link-url");
            linkUrl.innerHTML = localDisplayPath(file.filename);
            // linkUrl.innerHTML = file.filename // .substring(0, file.filename.lastIndexOf('/'))

            let save = document.createElement("p");
            save.classList.add("save-link");
            save.dataset.title = localPdfTitle(file.filename);
            save.dataset.fileId = file.id;
            save.dataset.url = file.filename;
            save.innerText = "save!";

            saveDiv.appendChild(save);
            leftDiv.appendChild(icon);
            leftDiv.appendChild(title);
            leftDiv.appendChild(linkUrl);

            leftDiv.addEventListener("click", function() {
              chrome.downloads.open(file.id);
            });

            let more = document.createElement("img");
            more.id = "more_icon";
            more.src = "../../assets/More.png";
            more.addEventListener("click", function() {
              chrome.downloads.show(file.id);
            });

            saveDiv.addEventListener("click", function(e) {
              saveLocalPdf(e);
            });

            rightDiv.appendChild(more);

            fileItem.appendChild(saveDiv);
            fileItem.appendChild(leftDiv);
            fileItem.appendChild(rightDiv);
            fileElement.appendChild(fileItem);
          } else {
            // console.log(`[INFO] skipped duplicate file: ${file.filename}.`)
          }
        }
      });

      // console.log(`[INFO] ${localPdfCount} local PDFs found.`)

      loadSettings();
    }
  );
}

function footer(count, contextString) {
  let plural = count > 1 ? "s" : "";

  let footerDivs = document.getElementsByClassName("footer");
  let footerLeft = document.getElementById("footer-left");

  let countDisplay = document.getElementById("count-display");

  countDisplay.innerHTML = `Showing ${count} ${contextString} PDF${plural}.`;
}

// tab buttons
let onlineTabLink = document.getElementById("online-tab-link");
let localTabLink = document.getElementById("local-tab-link");
let savedTabLink = document.getElementById("saved-tab-link");
let settingsTabLink = document.getElementById("settings-link");

// event handlers for tab buttons
onlineTabLink.addEventListener("click", function(event) {
  footer(onlineCount, "online");
  openTab(event, "online");
});

localTabLink.addEventListener("click", function(event) {
  footer(localPdfCount, "local");
  openTab(event, "local");
});

savedTabLink.addEventListener("click", function(event) {
  savedTabContainer = document.getElementById("saved-list");
  while (savedTabContainer.firstChild)
    savedTabContainer.removeChild(savedTabContainer.firstChild);
  populateSavedTab();
  openTab(event, "saved");
});

settingsTabLink.addEventListener("click", function() {
  open("../options/options.html");
});

onlineTabLink.click();

// function that handles switching between tabs
function openTab(evt, tabName) {
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "inline-block";
  evt.currentTarget.className += " active";
}

// function that loads the settings from the options.js script
function loadSettings() {
  chrome.storage.sync.get(["savedTab", "filesPerPage"], function(result) {
    console.log(result);
    if (result.savedTab) {
      document.getElementById("online-footer").style = "color: red";
    }

    if (result.filesPerPage) {
      // TODO
    }
  });
}

// *******SAVING AND DISPLAYING SAVED PDFs*******
function populateSavedTab() {
  getFromStorage(getDownloadIcons);
}

function getDownloadIcons(chromeStorage) {
  footerData(chromeStorage.savedPdfs);
  if (typeof chromeStorage.savedPdfs === "undefined") {
    return;
  }

  let savedPdfsCopy = JSON.parse(JSON.stringify(chromeStorage.savedPdfs));
  let promises = [];

  savedPdfsCopy.forEach(function(pdf) {
    if (pdf.type === "online") {
      return;
    }
    promises.push(
      new Promise(function(resolve, reject) {
        const fileIdString = pdf.fileId;
        const fileIdInt = parseInt(fileIdString);
        // had to find icons here instead of on save
        chrome.downloads.getFileIcon(
          fileIdInt,
          {
            size: 16
          },
          function(iconUrl) {
            pdf.iconUrl = iconUrl;
            resolve();
          }
        );
      })
    );
  });

  Promise.all(promises).then(function(results) {
    buildSavedMarkup(savedPdfsCopy);
  });
}

function footerData(savedPdfCollection) {
  let count;
  if (savedPdfCollection) {
    count = savedPdfCollection.length;
  } else {
    count = 0;
  }

  footer(count, "saved");
}

function buildSavedMarkup(savedPdfCollection) {
  savedPdfCollection.forEach(function(pdf) {
    let listItem = document.createElement("li");
    listItem.classList.add("list-item");

    let leftDiv = document.createElement("div");
    let rightDiv = document.createElement("div");

    leftDiv.classList.add("list-div", "left");
    rightDiv.classList.add("list-div", "right");

    let title = document.createElement("p");
    title.classList.add("link-title");
    title.innerText = pdf.title;

    let linkUrl = document.createElement("p");
    linkUrl.classList.add("link-url");
    linkUrl.innerHTML = formatPdfDisplayPath(pdf.url)

    let icon = document.createElement("img");
    icon.classList.add("link-thumb");
    icon.src = typeof pdf.iconUrl === "undefined" ? "" : pdf.iconUrl;

    leftDiv.appendChild(icon);
    leftDiv.appendChild(title);
    leftDiv.appendChild(linkUrl);
    leftDiv.addEventListener("click", function() {
      // window.open(pdf.url)
      console.log("i want to open this!");
    });

    listItem.appendChild(leftDiv);
    listItem.appendChild(rightDiv);
    savedList.appendChild(listItem);
  });
}

function formatPdfDisplayPath(pathString, type) {
  console.log(pathString, type)
  return type === "online"
    ? onlineDisplayPath(pathString)
    : localDisplayPath(pathString);
}

function onlineDisplayPath(pathString) {
  return decodeURI(pathString)
      .substring(0, 50)
      .replace(" ", "")
}

function saveOnlinePdf(e) {
  var title = e.target.dataset.title;
  var pdfUrl = e.target.dataset.url;
  var newSavedPdf = {
    title: title,
    url: pdfUrl,
    type: "online",
    iconUrl: `chrome://favicon/${pdfUrl}`
  };

  saveToStorage(newSavedPdf, "url", pdfUrl);
}

function saveLocalPdf(e) {
  var title = e.target.dataset.title;
  var fileId = e.target.dataset.fileId;
  var url = e.target.dataset.url;
  var newSavedPdf = {
    title: title,
    fileId: fileId,
    url: url,
    type: "local"
  };

  saveToStorage(newSavedPdf, "fileId", fileId);
}

function saveToStorage(newSavedPdf, uniqueKey, uniqueKeyVal) {
  getFromStorage(function(response) {
    var currentSaves = response.savedPdfs || [];
    if (!isAlreadySaved(currentSaves, uniqueKey, uniqueKeyVal)) {
      currentSaves.push(newSavedPdf);
      setInStorage(currentSaves);
    }
  });
}

function isAlreadySaved(currentSaves, key, newVal) {
  return currentSaves.some(function(savedPdf) {
    return savedPdf[key] === newVal;
  });
}

function setInStorage(currentSaves) {
  // TODO: Use semicolons or not?
  chrome.storage.sync.set({ savedPdfs: currentSaves }, function(response) {
    console.log("pdf saved");
  });
}

function getFromStorage(callback) {
  return chrome.storage.sync.get("savedPdfs", callback);
}
