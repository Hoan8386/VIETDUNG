// Cần inject thư viện PizZip và docxtemplater qua HTML injection trước
// từ file scv_html_external_libs
/**
 * @NApiVersion 2.1
 */
define([],

    () => {

        const loadFileDocx = (url) => {
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

        return {
            loadFileDocx
        }

    });
