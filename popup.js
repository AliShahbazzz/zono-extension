const start = async (selectedGroups) => {
  class ContactFinder {
    #db;
    #chatToFind;
    #dbName = "model-storage";
    #chatsCol = "chat";
    #contactCol = "contact";
    #groupCol = "participant";

    constructor(chatGroupName) {
      this.#chatToFind = chatGroupName;
    }

    async openConnection() {
      if (!this.#db) {
        const dbName = this.#dbName;
        this.#db = await new Promise((resolve, reject) => {
          let request = indexedDB.open(dbName);
          request.onerror = (event) => {
            reject(event);
          };
          request.onsuccess = (event) => {
            resolve(event.target.result);
          };
        });
      }
      return this.#db;
    }

    async promisifyCol(collection, query, count) {
      const db = await this.openConnection();
      return new Promise((resolve, reject) => {
        const request = db
          .transaction(collection)
          .objectStore(collection)
          .getAll(query, count);

        request.onerror = (event) => {
          reject(event);
        };
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
      });
    }

    async #getChats() {
      const allChats = await this.promisifyCol(this.#chatsCol);
      const chatToFind = this.#chatToFind;
      return allChats.filter((chat) => {
        return chat.name && chat.name.includes(chatToFind);
      });
    }

    async getAllGroups() {
      return await this.promisifyCol(this.#groupCol);
    }

    async getGroups() {
      const chats = (await this.#getChats()).map((chat) => chat.id);
      const allGroups = await this.promisifyCol(this.#groupCol);

      return allGroups.filter((group) => {
        return group.groupId && chats.includes(group.groupId);
      });
    }

    async #getGroupParticipants() {
      const groups = await this.getGroups();
      const map = new Map();

      groups.forEach((group) => {
        group.participants.forEach((par) => {
          const num = par.replace("@c.us", "");
          map.set(num, num);
        });
      });

      return map;
    }

    async #getContacts() {
      return this.promisifyCol(this.#contactCol);
    }

    async getGroupMembers() {
      const members = await this.#getGroupParticipants();
      const contacts = await this.#getContacts();

      contacts.forEach((contact) => {
        var num;
        if (contact.phoneNumber) {
          num = contact.phoneNumber.split("@")[0];
        } else if (contact.id) {
          num = contact.id.split("@")[0];
        }
        if (num && members.get(num)) {
          members.set(num, {
            phoneNum: num,
            name: contact.name,
            pushname: contact.pushname,
          });
        }
      });
      return members;
    }

    async downloadMembersAsCSV() {
      const members = await this.getGroupMembers();
      let csvContent = "data:text/csv;charset=utf-8,";

      for (const [key, value] of members.entries()) {
        const values = [value.phoneNum];

        if (value.name) values.push(value.name);
        if (value.pushname) values.push(value.pushname);

        let row = values.join(",");
        csvContent += row + "\r\n";
      }
      var link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", "my_data.csv");
      document.body.appendChild(link); // Required for FF

      link.click();
    }
  }

  try {
    // // await waitForWhatsAppWebToLoad("header span"); // Wait for at least one span under header to be available

    const isGroupSelected = document.querySelectorAll("header").length > 3;


    console.log(document.querySelectorAll("header"));
    if (selectedGroups.length !== 0) {


      const contactFinder = new ContactFinder(
        document
          .querySelectorAll("header")[3]
          .querySelectorAll("span")[1].innerHTML
      );
      console.log("contactFinder: ", contactFinder);
      const members = await contactFinder.getGroupMembers(); // This will return a JS Map Object

      // const allGroups = await contactFinder.getAllGroups();
      console.log("members: ", members);
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
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  const getCheckedInputs = () => {
    const checkedInputs = [];
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        checkedInputs.push(checkbox.value);
      }
    });
    return checkedInputs;
  };

  const selectedGroups = getCheckedInputs();

  console.log("selectedGroups: ", selectedGroups);

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: start,
      args: [selectedGroups]
    });
  });
};

const extractGroups = async () => {
  class ContactFinder {
    #db;
    #chatToFind;
    #dbName = "model-storage";
    #chatsCol = "chat";
    #contactCol = "contact";
    #groupCol = "participant";

    constructor(chatGroupName) {
      this.#chatToFind = chatGroupName;
    }

    async openConnection() {
      if (!this.#db) {
        const dbName = this.#dbName;
        this.#db = await new Promise((resolve, reject) => {
          let request = indexedDB.open(dbName);
          request.onerror = (event) => {
            reject(event);
          };
          request.onsuccess = (event) => {
            resolve(event.target.result);
          };
        });
      }
      return this.#db;
    }

    async promisifyCol(collection, query, count) {
      const db = await this.openConnection();
      return new Promise((resolve, reject) => {
        const request = db
          .transaction(collection)
          .objectStore(collection)
          .getAll(query, count);

        request.onerror = (event) => {
          reject(event);
        };
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
      });
    }

    async #getChats() {
      const allChats = await this.promisifyCol(this.#chatsCol);
      const chatToFind = this.#chatToFind;
      return allChats.filter((chat) => {
        return chat.name && chat.name.includes(chatToFind);
      });
    }

    async getAllGroups() {
      return await this.promisifyCol(this.#groupCol);
    }

    async getGroups() {
      const chats = (await this.#getChats()).map((chat) => chat.id);
      const allGroups = await this.promisifyCol(this.#groupCol);

      return allGroups.filter((group) => {
        return group.groupId && chats.includes(group.groupId);
      });
    }

    async #getGroupParticipants() {
      const groups = await this.getGroups();
      const map = new Map();

      groups.forEach((group) => {
        group.participants.forEach((par) => {
          const num = par.replace("@c.us", "");
          map.set(num, num);
        });
      });

      return map;
    }

    async #getContacts() {
      return this.promisifyCol(this.#contactCol);
    }

    async getGroupMembers() {
      const members = await this.#getGroupParticipants();
      const contacts = await this.#getContacts();

      contacts.forEach((contact) => {
        var num;
        if (contact.phoneNumber) {
          num = contact.phoneNumber.split("@")[0];
        } else if (contact.id) {
          num = contact.id.split("@")[0];
        }
        if (num && members.get(num)) {
          members.set(num, {
            phoneNum: num,
            name: contact.name,
            pushname: contact.pushname,
          });
        }
      });
      return members;
    }

    async downloadMembersAsCSV() {
      const members = await this.getGroupMembers();
      let csvContent = "data:text/csv;charset=utf-8,";

      for (const [key, value] of members.entries()) {
        const values = [value.phoneNum];

        if (value.name) values.push(value.name);
        if (value.pushname) values.push(value.pushname);

        let row = values.join(",");
        csvContent += row + "\r\n";
      }
      var link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", "my_data.csv");
      document.body.appendChild(link); // Required for FF

      link.click();
    }
  }

  try {
    const isScreenLoaded = document.querySelectorAll("header").length !== 0;
    console.log(document.querySelectorAll("header").length !== 0);
    if (isScreenLoaded) {
      const contactFinder = new ContactFinder(
        document.querySelectorAll("header")[0].innerHTML
      );
      console.log("contactFinder: ", contactFinder);
      const allGroups = await contactFinder.getAllGroups();

      console.log("allGroups: ", allGroups);

      const allChats = await contactFinder.promisifyCol("chat");

      console.log("allChats: ", allChats);

      const filteredName = allChats
        .filter((chat) => {
          return allGroups.some((group) => chat.id === group.groupId);
        })
        .map((group) => {
          return { name: group.name, id: group.id };
        });

      console.log("filteredName: ", filteredName);

      return filteredName;
    } else {
      console.log("WhatsApp not loaded");
    }
  } catch (error) {
    console.log(error);
  }
};

const updateList = async (allGroups) => {
  const list = document.getElementById("groupList");

  const updatedList = `
  <div>
  ${allGroups
    .map((group) => {
      return `<input type="checkbox" id="${group.id}" name="${group.id}" value="${group.id}" />  
      <label>${group.name}</label> <br>`;
    })
    .join("")}
  </div>`;

  console.log("updatedList: ", updatedList);
  list.innerHTML = updatedList;

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      // Call function to get checked inputs
      const checkedInputs = getCheckedInputs();
      console.log("Checked inputs:", checkedInputs);
    });
  });

  // Function to get checked inputs
  const getCheckedInputs = () => {
    const checkedInputs = [];
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        checkedInputs.push(checkbox.value);
      }
    });
    return checkedInputs;
  };
};

document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: extractGroups,
      },
      (response) => {
        console.log("response: ", response);
        console.log("result: ", response[0].result);
        updateList(response[0].result);
      }
    );
  });
});

// document.getElementById("fetchGroups").onclick = function () {
//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     chrome.scripting.executeScript({
//       target: { tabId: tabs[0].id },
//       function: fetchGroups,
//     });
//   });
// };
