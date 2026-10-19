/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/url', '../common/scv_common_excel_helper'],

    function (url,excelHelper) {

        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */

        const pageInit = (scriptContext) => {
            let rec = scriptContext.currentRecord;
            addButtonUpdatePreviousPrice(rec);
        }

        const addButtonUpdatePreviousPrice = (rec) => {
            setTimeout(function () {
                const sampleTbl = document.getElementById("tbl_clearsplitsitem");
                if (!sampleTbl) {
                    console.warn('Sample table not found');
                    return;
                }
                let newTd = sampleTbl.parentElement.cloneNode(true);
                let newTable = newTd.querySelector("table");
                newTable.id = 'tbl_update_previous_price';

                let tbody = newTable.querySelector("tbody");
                let tr = tbody.querySelector("tr");
                tr.id = 'tr_update_previous_price_row';
                tr.children[2].remove()
                tr.children[0].remove()

                let td = tr.children[0];
                td.id = 'td_update_previous_price';
                td.querySelector("input").remove();

                let inputButton = document.createElement('input');
                inputButton.type = 'button';
                inputButton.className = 'rndbuttoninpt bntBgT';
                inputButton.value = 'Cập nhật giá cũ';
                inputButton.setAttribute('data-nsps-label', 'Cập nhật giá cũ');
                inputButton.setAttribute('data-nsps-id', 'updatepreviousprice');
                inputButton.id = 'updatepreviousprice';
                inputButton.name = 'updatepreviousprice';
                inputButton.onclick = async () => updatePreviousPrice(rec);
                td.appendChild(inputButton);
                sampleTbl.parentElement.parentNode.insertBefore(newTd, sampleTbl.parentElement.nextSibling);


            }, 500);
        }

        const updatePreviousPrice = async (rec) => {
            let slUrl = url.resolveScript({
                scriptId: 'customscript_scv_sl_get_previous_price',
                deploymentId: 'customdeploy_scv_sl_get_previous_price',
                returnExternalUrl: false
            });
            let params = {
                recid: rec.id,
                rectype: rec.type,
                currency: rec.getValue('currency'),
            }

            let objResponse = await excelHelper.postRequestByAjax(slUrl, params);
            let arrItemValues = objResponse.arrItemPreviousPrice;

            if (arrItemValues && arrItemValues.length > 0) {
                let lc = rec.getLineCount("item");
                for (let i = 0; i < lc; i++) {
                    rec.selectLine("item", i);
                    let itemId = rec.getSublistValue("item", "item", i);
                    let item = arrItemValues.find(item => item.item === itemId);
                    let previousPrice = item ? item.previous_price : null;
                    if (previousPrice) {
                        rec.setCurrentSublistValue("item", "custcol_scv_old_price", previousPrice);
                    }
                    rec.commitLine("item"); // Commit the changes for the current line
                }
                alert('Cập nhật giá cũ thành công!');
            } else {
                alert('Không có dữ liệu để cập nhật.');
            }
        }

        return {
            pageInit,
        };

    });
