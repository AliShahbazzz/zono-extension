const extractGroups = async () => {
  class ContactFinder {
    #db;
    #chatToFind;
    #dbName = "model-storage";
    #chatsCol = "chat";
    #contactCol = "contact";
    groupCol = "participant";

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

    async getChats() {
      const allChats = await this.promisifyCol(this.#chatsCol);
      const chatToFind = this.#chatToFind;
      return allChats.filter((chat) => {
        return chat.name && chat.name.includes(chatToFind);
      });
    }

    async getAllGroups() {
      return await this.promisifyCol(this.groupCol);
    }

    async getGroups() {
      const chats = (await this.getChats()).map((chat) => chat.id);
      const allGroups = await this.promisifyCol(this.groupCol);

      return allGroups.filter((group) => {
        return group.groupId && chats.includes(group.groupId);
      });
    }

    async getGroupParticipants() {
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

    async getContacts() {
      return this.promisifyCol(this.#contactCol);
    }

    async getGroupMembers() {
      const members = await this.getGroupParticipants();
      const contacts = await this.getContacts();

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
    // console.log(document.querySelectorAll("header").length !== 0);
    if (isScreenLoaded) {
      const contactFinder = new ContactFinder(
        document.querySelectorAll("header")[0].innerHTML
      );
      // console.log("contactFinder: ", contactFinder);
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

      // console.log("filteredName: ", filteredName);

      return filteredName;
    } else {
      console.log("WhatsApp not loaded");
      console.log("hello");
      return "WhatsApp not loaded";
    }
  } catch (error) {
    console.log(error);
  }
};

const updateList = async (allGroups) => {
  const list = document.getElementById("groupList");

  const updatedList = `
    <div style="height: 90px; overflow: auto; ">
    ${allGroups
      .map((group) => {
        return `<input type="checkbox" id="${group.id}" name="${group.name}" value="${group.id}" />  
        <label style="font-size: 14px;">${group.name}</label> <br>`;
      })
      .join("")}
    </div>`;

  // console.log("updatedList: ", updatedList);
  list.innerHTML = updatedList;
};

const upadteError = () => {
  const span = document.getElementById("zono-ext-subheading-text");
  const extractBtn = document.getElementById("extractBtn");

  span.innerHTML = `Please open WhatsApp Web to continue`;
  extractBtn.style.display = "none";
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
        if (typeof response[0].result === "string") {
          console.log("WhatsApp not loaded");
          upadteError();
        } else {
          updateList(response[0].result);
        }
      }
    );
  });
});
