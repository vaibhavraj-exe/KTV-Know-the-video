let isChatInitialized = false;

window.onload = function () {
  let currentUrl = "";

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentUrl = tabs[0].url;
    console.log(currentUrl);

    const apiUrl = "http://localhost:8000/api/results";

    const dataToSend = {
      video_url: currentUrl,
    };

    var resultData = "";

    if (currentUrl != "" || currentUrl != undefined || currentUrl != null) {
      console.log("fetched");
      fetch(apiUrl + `?video_url=${dataToSend.video_url}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })
        .then((response) => response.json())
        .then((data) => {
          d = JSON.parse(data.data);
          console.log("Response from FastAPI:", d);
          resultData = d;

          console.log(resultData);

          document.querySelector("#po-cent").innerHTML = Math.floor(
            resultData.percentages[1]
          ).toString() + "%";
          document.querySelector("#nu-cent").innerHTML = Math.floor(
            resultData.percentages[2]
          ).toString() + "%";
          document.querySelector("#ne-cent").innerHTML = Math.floor(
            resultData.percentages[0] // Corrected index
          ).toString() + "%";

          let imp_keywds = document.querySelector("#imp-ks"); // Corrected selector

          resultData.important_keywords.forEach((e) => {
            if (e[1] == "positive") {
              var myElement = document.createElement("div");

              // Add classes to the div element
              myElement.classList.add(
                "rounded-lg",
                "bg-green",
                "text-p-10",
                "text-sm",
                "w-fit",
                "font-semibold",
                "text-white"
              );

              // Add content to the div element
              myElement.textContent = e[0];

              // imp_keywds.appendChild(document.createTextNode(e));
              imp_keywds.appendChild(myElement);
            } else {
              var myElement = document.createElement("div");

              // Add classes to the div element
              myElement.classList.add(
                "rounded-lg",
                "bg-red",
                "text-p-10",
                "text-sm",
                "w-fit",
                "font-semibold",
                "text-white"
              );

              // Add content to the div element
              myElement.textContent = e[0];

              // imp_keywds.appendChild(document.createTextNode(e));
              imp_keywds.appendChild(myElement);
            }
          });
        })
        .catch((error) => console.error("Error:", error));
    }
  });

const sendButton = document.getElementById('send-button')
// window.onload = function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;
    console.log("currentUrl : ", currentUrl);

    const apiUrl = "http://localhost:8001/initialize";

    const dataToSend = {
      video_url: currentUrl,
    };

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Response from server:", data);
        isChatInitialized = true;
      })
      .catch((error) => console.error("Error:", error));
  });

// window.onload = function () {
  sendButton.addEventListener('mousedown', function () {
    console.log('Send button clicked');

    if (!isChatInitialized) {
      alert('Please wait for the chat to initialize.');
    }
    const chatContainer = document.getElementById('chat-container');
    const chatInput = document.getElementById('chat-input');

    const messageText = chatInput.value;
    if (messageText.trim() !== "") {
      fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_input: messageText }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Response from chat API:', data);
          const newMessage = document.createElement('div');
          newMessage.classList.add('chat-message');
          newMessage.innerText = data.response;
          chatContainer.appendChild(newMessage);
        })
        .catch((error) => console.error('Error:', error));
      // const newMessage = document.createElement('div');
      // newMessage.classList.add('chat-message');
      // newMessage.innerText = messageText;
      // chatContainer.appendChild(newMessage);

      chatInput.value = '';
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  document.getElementById('chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      document.getElementById('send-button').click();
    }
  });
}