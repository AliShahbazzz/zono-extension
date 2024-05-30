const start = async (selectedGroups) => {
  var db = undefined;
  var chatToFind = "";
  const dbName = "model-storage";
  const chatsCol = "chat";
  const contactCol = "contact";
  const groupCol = "participant";

  const openConnection = async () => {
    if (!db) {
      db = await new Promise((resolve, reject) => {
        let request = indexedDB.open(dbName);
        request.onerror = (event) => {
          reject(event);
        };
        request.onsuccess = (event) => {
          resolve(event.target.result);
        };
      });
    }
    return db;
  };

  const promisifyCol = async (collection, query, count) => {
    const db = await openConnection();
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
  };

  const getChats = async () => {
    const allChats = await promisifyCol(chatsCol);

    return allChats.filter((chat) => {
      return chat.name && chat.id.includes(chatToFind);
    });
  };

  const getAllGroups = async () => {
    return await promisifyCol(groupCol);
  };

  const getGroups = async () => {
    const chats = (await getChats()).map((chat) => chat.id);
    const allGroups = await promisifyCol(groupCol);

    return allGroups.filter((group) => {
      return group.groupId && chats.includes(group.groupId);
    });
  };

  const getGroupParticipants = async () => {
    const groups = await getGroups();
    const map = new Map();

    groups.forEach((group) => {
      group.participants.forEach((par) => {
        const num = par.replace("@c.us", "");
        map.set(num, num);
      });
    });

    return map;
  };

  const getContacts = () => {
    return promisifyCol(contactCol);
  };

  const getGroupMembers = async () => {
    const members = await getGroupParticipants();
    const contacts = await getContacts();

    contacts.forEach((contact) => {
      var num;
      if (contact.phoneNumber) {
        num = contact.phoneNumber.split("@")[0];
      } else if (contact.id) {
        num = contact.id.split("@")[0];
      }
      if (num && members.get(num)) {
        members.set(num, {
          mobileNumber: num,
          name: contact.name,
          pushname: contact.pushname,
        });
      }
    });

    return members;
  };

  const downloadMembersAsCSV = async () => {
    const members = await getGroupMembers();
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
  };

  try {
    // // await waitForWhatsAppWebToLoad("header span"); // Wait for at least one span under header to be available

    // const isGroupSelected = document.querySelectorAll("header").length > 3;

    // console.log(document.querySelectorAll("header"));
    if (selectedGroups.length !== 0) {
      const processGroupsSequentially = async (selectedGroups) => {
        const result = [];

        for (const group of selectedGroups) {
          chatToFind = group?.id;
          console.log("chatToFind: ", chatToFind);

          // Await the result of the asynchronous function
          const contacts = await getGroupMembers();

          // Push the result into the result array
          result.push({
            groupId: group?.id,
            name: group?.name,
            customers: [...Array.from(contacts.values())],
          });
        }

        // After all groups have been processed, return the result
        return result;
      };

      // Usage
      await processGroupsSequentially(selectedGroups).then(async (result) => {
        const finalJson = { groups: result };
        console.log("All groups processed:", finalJson);

        const urlParams = new URLSearchParams(window.location.search);
        const workspaceId = urlParams.get("workspaceId");

        console.log("workspaceId: ", workspaceId);

        const requestOptions = {
          method: "POST",
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7InVzZXIiOnsiaWQiOiI4ZDgyOGMyOS05MjE5LTQ3Y2YtYmU1Yi1iYTkzN2RkN2RjOGMifX0sInNlcnZlciI6Inpvbm9hZG1pbiIsImlhdCI6MTcxNjg5OTMzMX0.D_NSG7W-BwfEVCdz2lUWm5CuyRmdtAT-6D2quAr02Qc`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentType: "whatsappGroups",
            mimeType: "application/json",
            entityId: workspaceId,
          }),
        };

        await fetch(
          `https://api-qa.zono.digital/workspaces/documents/v2/${workspaceId}?sellerWorkspaceId=${workspaceId}`,
          requestOptions
        )
          .then(async (response) => {
            console.log("response: ", response);

            if (response) {
              const presignedUrl = await response
                .json()
                .then((res) => res.presignedUrl);

              console.log("presignedUrl: ", presignedUrl);

              await fetch(presignedUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(finalJson),
              }).then((res) => {
                window.open(
                  "https://app-qa.zono.digital/admin/communication?showPreview=true",
                  "_self"
                );
                return true;
              });
            }
          })
          .then((result) => console.log(result))
          .catch((error) => console.error(error));
      });
    } else {
      console.log("Please select a group");
    }

    // Optionally download CSV
    // await contactFinder.downloadMembersAsCSV(); // This will download the contacts as CSV
  } catch (error) {
    console.log(error);
  }
};

document.getElementById("extractBtn").onclick = async () => {
  const btn = document.getElementById("extractBtn");

  btn.innerText = "Please wait...";

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  const getCheckedInputs = () => {
    const checkedInputs = [];
    checkboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        checkedInputs.push({ id: checkbox.value, name: checkbox.name });
      }
    });
    return checkedInputs;
  };

  const selectedGroups = getCheckedInputs();

  console.log("selectedGroups: ", selectedGroups);

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: start,
        args: [selectedGroups],
      },
      (results) => {
        console.log("results: ", results);
        window.close();
      }
    );
  });
};
