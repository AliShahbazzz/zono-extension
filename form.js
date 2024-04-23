// const fetchGroups = async () => {
//   try {
//     const isScreenLoaded = document.querySelectorAll("header").length !== 0;
//     console.log(document.querySelectorAll("header").length !== 0);
//     if (isScreenLoaded) {
//       const contactFinder = new ContactFinder(
//         document.querySelectorAll("header")[0].innerHTML
//       );
//       console.log("contactFinder: ", contactFinder);
//       const allGroups = await contactFinder.getAllGroups();

//       console.log("allGroups: ", allGroups);

//       const group_select = document.getElementById("selected_group");

//       console.log("group_select: ", group_select);

//       allGroups.forEach((group) => {
//         group_select.options[group_select.options.length] = new Option(
//           "Text 1",
//           "Value1"
//         );
//       });
//     } else {
//       console.log("WhatsApp not loaded");
//     }
//   } catch (error) {
//     console.log(error);
//   }
// };

// document.getElementById("fetchGroups").onclick = function () {
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     chrome.scripting.executeScript({
//       target: { tabId: tabs[0].id },
//       function: fetchGroups,
//     });
//   });
// };
