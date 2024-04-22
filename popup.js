const start = async () => {
  try {
    // // await waitForWhatsAppWebToLoad("header span"); // Wait for at least one span under header to be available

    const isGroupSelected = document.querySelectorAll("header").length > 1;
    console.log(document.querySelectorAll("header"));
    if (isGroupSelected) {
      const contactFinder = new ContactFinder(
        document
          .querySelectorAll("header")[1]
          .querySelectorAll("span")[1].innerHTML
      );
      console.log("contactFinder: ", contactFinder);
      // const members = await contactFinder.getGroupMembers(); // This will return a JS Map Object

      const allGroups = await contactFinder.getAllGroups();
      console.log("allGroups: ", allGroups);
    } else {
      console.log("Please select a group");
    }

    // Optionally download CSV
    // await contactFinder.downloadMembersAsCSV(); // This will download the contacts as CSV
  } catch (error) {
    console.log(error);
  }
};

document.getElementById("extractBtn").onclick = function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: start,
    });
  });
};
