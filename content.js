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

  async #promisifyCol(collection, query, count) {
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
    const allChats = await this.#promisifyCol(this.#chatsCol);
    const chatToFind = this.#chatToFind;
    return allChats.filter((chat) => {
      return chat.name && chat.name.includes(chatToFind);
    });
  }

  async #getGroups() {
    const chats = (await this.#getChats()).map((chat) => chat.id);
    const allGroups = await this.#promisifyCol(this.#groupCol);

    return allGroups.filter((group) => {
      return group.groupId && chats.includes(group.groupId);
    });
  }

  async #getGroupParticipants() {
    const groups = await this.#getGroups();
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
    return this.#promisifyCol(this.#contactCol);
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

// function waitForWhatsAppWebToLoad(selector, maxAttempts = 10) {
//   return new Promise((resolve, reject) => {
//     const attemptToFindElement = (attempts) => {
//       const element = document.querySelector(selector);
//       if (element) {
//         resolve(element);
//       } else if (attempts < maxAttempts) {
//         setTimeout(() => attemptToFindElement(attempts + 1), 1000);
//       } else {
//         reject(new Error("Element not found within max attempts: " + selector));
//       }
//     };
//     attemptToFindElement(0);
//   });
// }

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
      const members = await contactFinder.getGroupMembers(); // This will return a JS Map Object
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

start();
