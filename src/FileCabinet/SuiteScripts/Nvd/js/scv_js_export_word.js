const loadStyleToHtmlPage = (container) => {
    let addLoading = container.getAttribute("scv-add-loading");
    if (addLoading === "T") return;
    container.setAttribute("scv-add-loading", "T");

    let linkElement = document.createElement('style');
    let textNode = document.createTextNode(`
        .scvLoader {
            width: 100px; height: 100px;
            border: 8px solid #e0e0e0;
            border-bottom-color: #0288d1;
            border-radius: 50%; display: inline-block; box-sizing: border-box; position: fixed;
            transform: translate(-50%, -50%); animation: scvRotationLoading 1s linear infinite;
        }
        .scvProgessStatus {
            position: fixed; top: 50%; left: 50%; font-size: 12px; transform: translate(-50%, -50%);
        }
        .scvMainLoader {
            position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 9999;
            display: flex; justify-content:center; align-items:center;
            flex-direction: column; background-color: rgba(255, 255, 255, 0.85);
        }
        @keyframes scvRotationLoading {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }`
    );
    linkElement.appendChild(textNode);
    document.head.appendChild(linkElement);
}

const showLoadingDialog = (isShow) => {
    let progessElement = "";
    if (isShow) {
        let container = document.getElementById("pageContainer") || document.getElementById("outerwrapper");
        if (!container) return console.error("Not found ElementId");

        loadStyleToHtmlPage(container);
        let mainLoader = document.createElement('div');
        mainLoader.classList.add("scvMainLoader");
        mainLoader.innerHTML = '<span class="scvLoader"></span><span id="idxProgessStatus" class="scvProgessStatus">Processing...</span>';

        container.appendChild(mainLoader);
        progessElement = document.querySelector(".scvProgessStatus");
    } else {
        let mainLoader = document.querySelector(".scvMainLoader");
        if (mainLoader) mainLoader.remove();
    }
    return progessElement;
}

const loadFile = (url) => {
    return new Promise((resolve, reject) => {
        PizZipUtils.getBinaryContent(url, (error, content) => {
            if (error) {
                reject(error);
            } else {
                resolve(content);
            }
        });
    });
}

const createDoc = (content) => {
    const zip = new PizZip(content);
    let doc = new window.docxtemplater(zip, {
        nullGetter() {
            return '';
        },
        linebreaks: true,
        paragraphLoop: true,
    });

    return doc;
}

const saveFile = (doc, fileName) => {
    const blob = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
    });

    saveAs(blob, fileName + ".docx");
}

const postRequestByAjax = (urlReq, params) => {
    return new Promise((resolve, reject) => {
        jQuery.ajax({
            type: 'post',
            url: urlReq,
            dataType: 'json',
            async: true,
            data: { ...params },
        })
        .done(function (response) {
            resolve(response);
        })
        .fail(function (request, status, error) {
            resolve(error);
        })
    });
}  

const libWord = {
    showLoadingDialog,
    loadFile,
    createDoc,
    saveFile,
    postRequestByAjax,
};