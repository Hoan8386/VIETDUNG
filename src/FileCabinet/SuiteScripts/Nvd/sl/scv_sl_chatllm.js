/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

define(['N/ui/serverWidget', 'N/runtime', 'N/llm'],
    function (serverWidget, runtime, llm) {
        
        const onRequest = (context) => {
            const SESSION_KEY_CHAT_HISTORY = 'CHAT_HISTORY';
            let currentSession = runtime.getCurrentSession();
            if (context.request.method === 'GET') {
                currentSession.set(SESSION_KEY_CHAT_HISTORY, '');
                let form = serverWidget.createForm({
                    title: "AI Chat"
                });
                
                let html = `
                <style>
                    .chat-box {
                        width:100%;
                        height:500px;
                        border:1px solid #ccc;
                        border-radius:6px;
                        display:flex;
                        flex-direction:column;
                        background:#fff;
                        font-family:Arial;
                    }
                    .chat-body {
                        flex:1;
                        padding:15px;
                        overflow-y:auto;
                        background:#f4f4f4;
                    }
                    .msg {
                        margin-bottom:15px;
                        padding:10px;
                        border-radius:6px;
                        max-width:70%;
                        display:block;
                    }
                    .user { background:#1E90FF; color:#fff; margin-left:auto; }
                    .bot { background:#fff; border:1px solid #ddd; }
                    .chat-input-area {
                        display:flex;
                        border-top:1px solid #ddd;
                        padding:10px;
                    }
                    .chat-input {
                        flex:1;
                        padding:8px;
                        border:1px solid #ccc;
                        border-radius:4px;
                    }
                    .send-btn {
                        width:80px;
                        margin-left:10px;
                        background:#3f51b5;
                        color:#fff;
                        border:none;
                        border-radius:4px;
                        cursor:pointer;
                    }
                </style>

                <div class="chat-box">
                    <div id="chatBody" class="chat-body"></div>

                    <div class="chat-input-area">
                        <input id="msgInput" class="chat-input" placeholder="Nhập tin nhắn..."/>
                        <input type="file" id="fileUpload" style="margin-left:10px;" />
                        <button type="button" class="send-btn" onclick="sendMessage()">Gửi</button>
                    </div>
                </div>

                <script>
                    const chat = document.getElementById("chatBody");
                    const input = document.getElementById("msgInput");
                    let fileInput = document.getElementById("fileUpload");
                    
                    // Gửi tin nhắn
                    async function sendMessage() {
                        let msg = input.value.trim();
                        let file = fileInput.files[0];
                        
                        if (!msg && !file) return;
                        
                        // User message
                        addMessage(msg, "user");
                        let fileName = null;
                        
                        if (file) {
                            fileName = file.name;
                        }
                        
                        let payload = {
                            text: msg,
                            fileName: fileName,
                            fileContent: file ? await readFile(file) : ''
                        };
                        
                        input.value = "";
                        fileInput.value = "";
                        
                        // Gửi lên Suitelet
                        let res = await fetch(window.location.href, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                        });
                
                        let json = await res.json();
                
                        // Bot message
                        addMessage(json.reply, "bot");
                        
                    }
                    
                    const readFile = (file) => {
                        return new Promise((resolve, reject) => {
                          const reader = new FileReader();
                    
                          reader.onload = function(e) {
                            resolve(e.target.result);
                          };
                    
                          reader.onerror = function(err) {
                            reject(err);
                          };
                    
                          // Kiểm tra loại file
                          if (file.type === "text/plain" || file.name.endsWith(".csv")) {
                            reader.readAsText(file); // đọc dạng text
                          } else {
                            reader.readAsDataURL(file); // đọc dạng base64
                          }
                        });
                      };
                    
                    // Add message to UI
                    function addMessage(text, type) {
                        let div = document.createElement("div");
                        div.className = "msg " + type;
                        div.innerText = text;
                
                        chat.appendChild(div);
                        chat.scrollTop = chat.scrollHeight;
                    }
                
                    // Gửi khi nhấn Enter
                    input.addEventListener("keydown", function (e) {
                        if (e.key === "Enter") {
                            e.preventDefault();   // ❗ Không submit form Suitelet
                            sendMessage();
                        }
                    });
                
                </script>
            `;
                
                form.addField({
                    id: 'custpage_html',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Chat'
                }).defaultValue = html;
                
                context.response.writePage(form);
            }
            
            if (context.request.method === 'POST') {
                let body = JSON.parse(context.request.body);
                let userText = body.text;
                let fileContent = body.fileContent;
                
                let chatHistory = currentSession.get(SESSION_KEY_CHAT_HISTORY);
                if (chatHistory) {
                    chatHistory = JSON.parse(chatHistory);
                } else {
                    chatHistory = [];
                }
                let documents = [];
                if (fileContent) {
                    documents.push({id: body.fileName, data: fileContent});
                }
                
                context.response.setHeader({name: "Content-Type", value: "application/json"});
                context.response.write(JSON.stringify({reply: callGPT(userText, chatHistory, documents)}));
                chatHistory.push(userText);
                currentSession.set(SESSION_KEY_CHAT_HISTORY, JSON.stringify(chatHistory));
            }
        }
        
        const callGPT = (question, chatHistory, documents) => {
            let chatHistoryLlm = chatHistory.map(text => {
                return llm.createChatMessage({role: llm.ChatRole.USER, text: text})
            });
            let documentsLlm = documents.map(o => {
                return llm.createDocument(o);
            });
            try {
                const response = llm.generateText({
                    preamble: "",
                    prompt: question,
                    chatHistory: chatHistoryLlm,
                    documents: documentsLlm,
                    modelFamily: llm.ModelFamily.COHERE_COMMAND_A,
                    modelParameters: {
                        maxTokens: 4000,
                        temperature: 0.2,
                        topK: 3,
                        topP: 0.7,
                        frequencyPenalty: 0.4,
                        presencePenalty: 0
                    }
                });
                return response.text;
            } catch (e) {
                log.error({title: 'Lỗi khi gọi GPT', details: e});
                return 'Đã xảy ra lỗi khi gọi GPT, vui lòng thử lại.';
            }
        };
        
        return {onRequest};
    });