/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/ui/message', 'N/url'],
    function (ccr, search, message, url) {
        
        const TRANSACTION_TYPE = {
            TRANSFER_ORDER: 'trnfrord',
            ITEM_FULFILLMENT: 'itemship',
            BIN_TRANSFER: 'bintrnfr',
            RECEIVE_INBOUND_SHIPMENT: 'receiveinboundshipment',
            ASSEMBLY_BUILD: 'build',
            ITEM_RECEIPT: 'itemrcpt',
            INVENTORY_STATUS_CHANGE: 'statchng'
        };
        
        const Sublist = {
            ITEM: 'item',
            COMPONENT: 'component',
            INVENTORY_ASSIGNMENT: 'inventoryassignment',
        }
        
        const pageInit = (scriptContext) => {
            clearLineInventoryDetail();
            initializeLineValueLotCustomInventoryDetail();
            initializeDisabledFieldsLot(scriptContext);
            initializeDataInventoryDetailPopup(scriptContext.currentRecord);
        };
        
        const setTargetDefaultInventoryStatus = () => {
            let listValuesInInnerPopup = getOnclickValuesInInnerPopup();
            let {param1, param2} = extractSetTargetParams(listValuesInInnerPopup[0]);
            if(param1 && param2) {
                setTarget(param1, param2);
            }
        }
        
        const initializeDataInventoryDetailPopup = () => {
            let urlParams = new URLSearchParams(window.location.search);
            let itemId = urlParams.get('item');
            let sublistIdParent = window.parent.nlapiGetFieldValue('type') === TRANSACTION_TYPE.ASSEMBLY_BUILD ? Sublist.COMPONENT : Sublist.ITEM;
            let isnumbered = window.parent.nlapiGetCurrentLineItemValue(sublistIdParent, 'isnumbered') || 'F';
            const isLotItem = isnumbered === 'T';
            
            const transtype = window.parent.nlapiGetFieldValue('type');
            let uitype = urlParams.get('uitype');
            const isShowInfoSerial = (TRANSACTION_TYPE.TRANSFER_ORDER === transtype || TRANSACTION_TYPE.ITEM_FULFILLMENT === transtype
                || TRANSACTION_TYPE.INVENTORY_STATUS_CHANGE === transtype || (TRANSACTION_TYPE.ASSEMBLY_BUILD === transtype && uitype === 'LOH_STRICT_VALIDATION_INVENTORY_NOT_AVAIL'));
            if(isShowInfoSerial) {
                if(isLotItem) {
                    initializeDataInventoryNumberToWindow({
                        arrLotId: '',//arrLotId,
                        itemId: itemId,
                        locationId: urlParams.get('location')
                    });
                    addButtonToSublist({
                        fieldId: 'custpage_scv_addlot',
                        listener: setDataLineInventoryDetail,
                        label: 'Add Serial/Lot Number'
                    });
                }
                
                addButtonToSublistMenu({
                    fieldId: 'custpage_scv_fillivd',
                    label: 'Fill Lot',
                    nextBtnId: 'close'
                });
            }
            
        };
        
        const addButtonToSublistMenu = ({fieldId, nextBtnId, label}) => {
            let targetTd = document.querySelector('table#tbl_'.concat(nextBtnId))?.parentElement;
            if (!targetTd) return;
            
            window.setCurrentIvd = setCurrentIvd;
            let newTd = document.createElement('td');
            newTd.innerHTML = `<td class="bntBgB pgBntG rndbuttoninpt bntBgT">${getContentButtonMenu(fieldId, label, 'window.setCurrentIvd();')}</td>`;
            targetTd.parentNode.insertBefore(newTd, targetTd.nextSibling);
        };
        
        const setCurrentIvd = () => {
            let sublistIdParent = window.parent.nlapiGetFieldValue('type') === TRANSACTION_TYPE.ASSEMBLY_BUILD ? Sublist.COMPONENT : Sublist.ITEM;
            let isnumbered = window.parent.nlapiGetCurrentLineItemValue(sublistIdParent, 'isnumbered') || 'F';
            let binitem = window.parent.nlapiGetCurrentLineItemValue(sublistIdParent, 'binitem');
            const isLotItem = isnumbered === 'T';
            const isBinItem = binitem === 'T';
            let currentRecord = ccr.get();
            if(isLotItem) {
                let dataInventoryNumber = window.SCV.dataInventoryNumber;
                if (Array.isArray(dataInventoryNumber) || dataInventoryNumber.length > 0) {
                    let lcIAss = currentRecord.getLineCount({sublistId: Sublist.INVENTORY_ASSIGNMENT});
                    if( lcIAss > 0) {
                        let issueinventorynumber = currentRecord.getCurrentSublistValue({sublistId: Sublist.INVENTORY_ASSIGNMENT, fieldId: 'issueinventorynumber'});
                        let issueDefault = getIssueDefault(currentRecord, lcIAss, issueinventorynumber, dataInventoryNumber);
                        if(issueDefault) {
                            currentRecord.setCurrentSublistValue({sublistId: Sublist.INVENTORY_ASSIGNMENT, fieldId: 'issueinventorynumber', value: issueDefault});
                        }
                    } else {
                        currentRecord.setCurrentSublistValue({sublistId: Sublist.INVENTORY_ASSIGNMENT, fieldId: 'issueinventorynumber', value: dataInventoryNumber[0].inventorynumber});
                    }
                }
                
            } else if(isBinItem) {
                setCurrentLineItemValueFirstSelectOption(currentRecord, 'binnumber');
            } else {
                try {
                    Listinventorystatus(this);
                    setTimeout(() => {
                        setTargetDefaultInventoryStatus();
                    }, 1000);
                } catch (e) {
                    //khong co Listinventorystatus
                }
            }
        }
        
        const getIssueDefault = (currentRecord, lcIAss, issueinventorynumber, dataInventoryNumber) => {
            let issueDefault = dataInventoryNumber.find(item => String(item.inventorynumber) === issueinventorynumber)?.inventorynumber;
            if(!issueDefault) {
                for(let i = 0; i < lcIAss; i++) {
                    let invNum = currentRecord.getSublistValue({sublistId: Sublist.INVENTORY_ASSIGNMENT, fieldId: 'issueinventorynumber', line: i});
                    let objInvNum = dataInventoryNumber.find(item => String(item.inventorynumber) === invNum);
                    if(objInvNum) {
                        objInvNum.isSelect = true;
                    }
                }
                issueDefault = dataInventoryNumber.filter(o => !o.isSelect)[0]?.inventorynumber || '';
            }
            return issueDefault;
        }
        
        const setDataLineInventoryDetail = () => {
            let urlInvNum = url.resolveScript({
                scriptId: 'customscript_scv_sl_popup_inv_num',
                deploymentId: 'customdeploy_scv_sl_popup_inv_num',
                params: {}
            });
            nlExtOpenWindow(urlInvNum, 'popupSerialLotNumber', window.innerWidth - 10, window.innerHeight - 20, this, true, "Select Serial/Lot Number");
        };
        
        const setCurrentLineItemValueFirstSelectOption = (currentRecord, fieldId) => {
            let fieldBin = currentRecord.getCurrentSublistField({sublistId: Sublist.INVENTORY_ASSIGNMENT, fieldId: fieldId});
            let selectOptions = fieldBin.getSelectOptions();
            let optionValue = selectOptions[0]?.value || selectOptions[1]?.value;
            if(optionValue) {
                currentRecord.setCurrentSublistValue({sublistId: Sublist.INVENTORY_ASSIGNMENT, fieldId: fieldId, value: optionValue});
            }
        }
        
        const callAPIDataInventoryNumber = (objParams) => {
            let resCall = window.nlapiRequestURL('/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_popup_inv_num&deploy=customdeploy_scv_sl_popup_inv_num_data', {...objParams});
            if (resCall.code === 200) return JSON.parse(resCall.getBody());
            alert(resCall.error.toString())
            return null;
        };
        
        
        const initializeDataInventoryNumberToWindow = ({
                                                           arrLotId,
                                                           itemId,
                                                           locationId
                                                       }) => {
            let objParams = {
                invNumsId: arrLotId.toString(),
                itemId: itemId,
                locationId: locationId,
                transtype: window.parent.nlapiGetFieldValue('type')
            };
            let data;
            try {
                data = callAPIDataInventoryNumber(objParams)?.response || [];
            } catch (e) {
                data = callAPIDataInventoryNumber(objParams)?.response || [];
            }
            window.SCV = window.SCV || {};
            window.SCV.dataInventoryNumber = data;
        };
        
        const getConentButton = (fieldId, label) => {
            return `
            <table id="tbl_${fieldId}" cellpadding="0" cellspacing="0" border="0" class="uir-button" style="margin-right:6px;cursor:hand;" role="presentation">
                <tbody>
                    <tr id="tr_${fieldId}" class="tabBnt">
                        <td id="tdleftcap_${fieldId}">
                            <img src="/images/nav/ns_x.gif" class="bntLT" border="0" height="50%" width="10" alt="">
                            <img src="/images/nav/ns_x.gif" class="bntLB" border="0" height="50%" width="10" alt="">
                        </td>
                        <td id="tdbody_${fieldId}" height="20" valign="top" nowrap="" class="bntBgB">
                            <input type="button" style="" class="rndbuttoninpt bntBgT" value="${label}" data-nsps-type="button" data-nsps-label="${label}"
                                id="${fieldId}" name="${fieldId}">
                        </td>
                        <td id="tdrightcap_${fieldId}">
                            <img src="/images/nav/ns_x.gif" height="50%" class="bntRT" border="0" width="10" alt="">
                            <img src="/images/nav/ns_x.gif" height="50%" class="bntRB" border="0" width="10" alt="">
                        </td>
                    </tr>
                </tbody>
            </table>`;
        }
        
        const getContentButtonMenu = (fldId, label, functionName) => {
            return `<table id="tbl_${fldId}btn" cellpadding="0" cellspacing="0" border="0" class="uir-button" style="margin-right:6px;cursor:hand;" role="presentation">
                <tbody>
                <tr id="tr_${fldId}btn" class="pgBntG">
                    <td id="tdleftcap_${fldId}btn"><img src="/images/nav/ns_x.gif" class="bntLT" border="0" height="50%"
                                                              width="3" alt=""/>
                        <img src="/images/nav/ns_x.gif" class="bntLB" border="0" height="50%" width="3" alt=""/>
                    </td>
                    <td id="tdbody_${fldId}btn" height="20" valign="top" nowrap="" class="bntBgB">
                        <input type="button" style="" class="rndbuttoninpt bntBgT " value="Fill Lot" data-nsps-type="button"
                               data-nsps-label="=${label}" id="${fldId}" name="${fldId}"
                               onclick= "${functionName}"
                               onmousedown="this.setAttribute('_mousedown','T'); setButtonDown(true, false, this);"
                               onmouseup="this.setAttribute('_mousedown','F'); setButtonDown(false, false, this);"
                               onmouseout="if(this.getAttribute('_mousedown') === 'T') setButtonDown(false, false, this);"
                               onmouseover="if(this.getAttribute('_mousedown') === 'T') setButtonDown(true, false, this);"/>
                   </td>
            
                    <td id="tdrightcap_${fldId}btn">
                        <img src="/images/nav/ns_x.gif" height="50%" class="bntRT" border="0" width="3" alt=""/>
                        <img src="/images/nav/ns_x.gif" height="50%" class="bntRB" border="0" width="3" alt=""/>
                    </td>
                </tr>
                </tbody>
            </table>`;
        }
        
        /**
         * Des:  Add Button To Sublist
         * @param fieldId {string}
         * @param nextBtnId {string}
         * @param label {string}
         * @param listener {function}
         */
        const addButtonToSublist = ({fieldId, listener, nextBtnId, label}) => {
            nextBtnId = nextBtnId || 'inventoryassignment_expressentry';
            let targetTd = document.querySelector('table#tbl_'.concat(nextBtnId))?.parentElement;
            if (!targetTd) return;
            
            let newTd = document.createElement('td');
            newTd.innerHTML = `<td class="bntBgB pgBntG rndbuttoninpt bntBgT">${getConentButton(fieldId, label)}</td>`;
            targetTd.parentNode.insertBefore(newTd, targetTd.nextSibling);
            
            document.getElementById(fieldId).addEventListener("click", function () {
                listener(this);
            });
        };
        
        const createButtonFillLot = (currentWindow) => {
            let fldId = 'custpage_filllot';
            let content = `<table id="tbl_${fldId}btn" cellpadding="0" cellspacing="0" border="0" class="uir-button" style="margin-right:6px;cursor:hand;" role="presentation">
                <tbody>
                <tr id="tr_${fldId}btn" class="pgBntG">
                    <td id="tdleftcap_${fldId}btn"><img src="/images/nav/ns_x.gif" class="bntLT" border="0" height="50%"
                                                              width="3" alt=""/>
                        <img src="/images/nav/ns_x.gif" class="bntLB" border="0" height="50%" width="3" alt=""/>
                    </td>
                    <td id="tdbody_${fldId}btn" height="20" valign="top" nowrap="" class="bntBgB">
                        <input type="button" style="" class="rndbuttoninpt bntBgT " value="Fill Lot" data-nsps-type="button"
                               data-nsps-label="Fill Lot" id="${fldId}btn" name="${fldId}btn"
                               onclick= "debugger; window.setLotNoLine();"
                               onmousedown="this.setAttribute('_mousedown','T'); setButtonDown(true, false, this);"
                               onmouseup="this.setAttribute('_mousedown','F'); setButtonDown(false, false, this);"
                               onmouseout="if(this.getAttribute('_mousedown') === 'T') setButtonDown(false, false, this);"
                               onmouseover="if(this.getAttribute('_mousedown') === 'T') setButtonDown(true, false, this);"/></td>
            
                    <td id="tdrightcap_${fldId}btn">
                        <img src="/images/nav/ns_x.gif" height="50%" class="bntRT" border="0" width="3" alt=""/>
                        <img src="/images/nav/ns_x.gif" height="50%" class="bntRB" border="0" width="3" alt=""/>
                    </td>
                </tr>
                </tbody>
            </table>`;
            let targetTd = currentWindow.document.querySelector('table#tbl_custpage_closebtn').parentElement;
            let newTd = currentWindow.document.createElement('td');
            newTd.innerHTML = `<td class="bntBgB pgBntG rndbuttoninpt bntBgT"> <div style="display: flex; gap: 10px;"> ${content} </div> </td>`;
            targetTd.parentNode.insertBefore(newTd, targetTd.nextSibling);
        }
        
        const initializeLineValueLotCustomInventoryDetail = () => {
            let urlParams = new URLSearchParams(window.location.search);
            let uitype = urlParams.get('uitype');
            const typeTrans = window?.parent?.nlapiGetFieldValue('type');
            //TRANSACTION_TYPE.ASSEMBLY_BUILD,
            // TRANSACTION_TYPE.ITEM_RECEIPT,
            // TRANSACTION_TYPE.RECEIVE_INBOUND_SHIPMENT
            if (!(TRANSACTION_TYPE.ASSEMBLY_BUILD === typeTrans && uitype === 'MOH_STRICT_VALIDATION')) {
                return;
            }
            let lotNo = typeTrans === TRANSACTION_TYPE.ASSEMBLY_BUILD ? window?.parent?.nlapiGetFieldValue('custbody_scv_assembly_lot') : '';
            const ELEMENT_ID_AUTO_LOT_NUMBER = 'Auto_Number_Screen_frame';
            var timeId = setInterval(() => {
                if (jQuery('#'.concat(ELEMENT_ID_AUTO_LOT_NUMBER))) {
                    const iframe = document.getElementById(ELEMENT_ID_AUTO_LOT_NUMBER);
                    const iframeWindow = iframe.contentWindow;
                    if (typeTrans === TRANSACTION_TYPE.ASSEMBLY_BUILD) {
                        initializeAddLotWithAssemblyBuild(iframeWindow, lotNo);
                    } else if ([TRANSACTION_TYPE.ITEM_RECEIPT, TRANSACTION_TYPE.RECEIVE_INBOUND_SHIPMENT].includes(typeTrans)) {
                        //initializeActionIncreateLot(iframe);
                    }
                    clearInterval(timeId);
                }
            }, 500);
            
        };
        
        //- Khi người dùng tạo mới phiếu nhập và click vào  inventory detail để nhập lô, cần tự động sinh số lô vào cột "Lot Number"
        // - Màn hình áp dụng: Receive Inbound Shipment; Item Receipt
        // - Điều kiện áp dụng với Item
        // 	+ Chỉ những mã quản lý theo lô. {item.islotitem} = T
        // 	+ Chỉ những mã có {item.custitem_aln_1_auto_numbered} = F
        // 	+ Chỉ những mã có nhóm cấp 2 {item.custitem_scv_group_lv2}= {customrecord_scv_inv_doc_number.custrecord_scv_lot_num_config_group2} nhóm cấp 2 trong màn hình config https://9684031-sb1.app.netsuite.com/app/common/custom/custrecordentry.nl?id=1&rectype=2033&whence=
        const initializeActionIncreateLot = (iframe) => {
            // iframe.onload = function() {
            //     const iframeWindow = iframe.contentWindow;
            //     const iframeDocument = iframe.contentDocument || iframeWindow.document;
            //
            //     // Your code to run after iframe has loaded
            //     console.log('Iframe fully loaded');
            //     setTimeout(function() {
            //         ((window)=>{
            //             debugger;
            //         })( iframeWindow);
            //     }, 1000);
            // };
            
            iframe.onload = function () {
                //const iframeWindow = iframe.contentWindow;
                const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                const script = iframeDocument.createElement('script');
                script.textContent = `
                    let  objLotssublist_machine = new Machine('lotssublist', document.forms['main_form'], document.forms['lotssublist_form'], document.getElementById('lotssublist_splits'), true, null);
                    debugger;
            
                `;
                iframeDocument.body.appendChild(script);
            }
            
            // Option 2: If the iframe might already be loaded
            // function runScriptInIframe() {
            //     try {
            //         const iframeWindow = iframe.contentWindow;
            //         const iframeDocument = iframe.contentDocument || iframeWindow.document;
            //         if (iframeDocument.readyState === 'complete' || iframeDocument.readyState === 'interactive') {
            //             // Iframe is already loaded
            //             console.log('Iframe already loaded, running script now');
            //             debugger;
            //         } else {
            //             // Still loading, attach event listener
            //             iframeDocument.addEventListener('DOMContentLoaded', function() {
            //                 console.log('Iframe DOMContentLoaded fired');
            //                 debugger;
            //             });
            //         }
            //     } catch (e) {
            //         console.error('Cannot access iframe content:', e);
            //     }
            // }
            //
            // runScriptInIframe();
        };
        
        const initializeAddLotWithAssemblyBuild = (iframeWindow, lotNo) => {
            iframeWindow.setLotNoLine = () => {
                iframeWindow.onbeforeunload = null;
                let lotNoASB = lotNo;
                const indexLine = iframeWindow.nlapiGetCurrentLineItemIndex('lotssublist');
                const lotNoLineFirst = iframeWindow.nlapiGetLineItemValue('lotssublist', 'custpage_aln_seriallotnumber', 1);
                const lotNoFill = Number(indexLine) === 1 ? lotNoASB : (lotNoLineFirst || lotNoASB);
                iframeWindow.nlapiSetCurrentLineItemValue('lotssublist', 'custpage_aln_seriallotnumber', lotNoFill);
                return false;
            };
            const indexLine = iframeWindow.nlapiGetCurrentLineItemIndex('lotssublist');
            if (Number(indexLine) === 1) iframeWindow.nlapiSetCurrentLineItemValue('lotssublist', 'custpage_aln_seriallotnumber', lotNo);
            createButtonFillLot(iframeWindow);
        };
        
        const initializeDisabledFieldsLot = (scriptContext) => {
            const objParams = getObjDataParentTransaction(scriptContext.currentRecord);
            // if (!objParams.ntype || !objParams.subsidiary) return;
            const objRes = getAPIDisableFieldsLot(objParams);
            if (typeof objRes !== 'object') return;
            if (objRes.isValid) {
                let objFieldStatus = scriptContext.currentRecord.getCurrentSublistField('inventoryassignment', 'inventorystatus');
                if (typeof objFieldStatus === 'object') objFieldStatus.isDisabled = true;
                if (objParams.type === 'bintrnfr') {
                    let objFieldToStatus = scriptContext.currentRecord.getCurrentSublistField('inventoryassignment', 'toinventorystatus');
                    if (typeof objFieldToStatus === 'object') objFieldToStatus.isDisabled = true;
                }
            }
        };
        
        const getObjDataParentTransaction = () => {
            let ntype = window.parent.nlapiGetFieldValue('ntype');
            let type = window.parent.nlapiGetFieldValue('type');
            let subsidiary = window.parent.nlapiGetFieldValue('subsidiary');
            let location = window.nlapiGetFieldValue('location');
            return {
                ntype,
                type,
                location,
                subsidiary
            };
        };
        
        const getAPIDisableFieldsLot = (objParams) => {
            let resCall = window.nlapiRequestURL('/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_dis_fld_lot&deploy=customdeploy_scv_sl_dis_fld_lot', {...objParams});
            if (resCall.code === 200) return JSON.parse(resCall.getBody());
            else {
                alert(resCall.error.toString())
            }
            return null;
        };
        
        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            let currentRecord = scriptContext.currentRecord;
            //let sublistIdParent = window.parent.nlapiGetFieldValue('type') === TRANSACTION_TYPE.ASSEMBLY_BUILD ? Sublist.COMPONENT : Sublist.ITEM;
            //let binitem = window.parent.nlapiGetCurrentLineItemValue(sublistIdParent, 'binitem') || 'F';
            if(scriptContext.fieldId === 'issueinventorynumber') {
                let dataLineSelect = window.ScvObjDataLineSelect || {};
                let {invNumberId, binNumberId} = dataLineSelect;
                let issueinventorynumber = currentRecord.getCurrentSublistValue({sublistId: Sublist.INVENTORY_ASSIGNMENT, fieldId: 'issueinventorynumber'});
                if(issueinventorynumber === String(invNumberId) && binNumberId) {
                    currentRecord.setCurrentSublistValue({sublistId: scriptContext.sublistId, fieldId: 'binnumber', value: binNumberId});
                }
            }
            
            let issueinventorynumber = currentRecord.getCurrentSublistValue({sublistId: Sublist.INVENTORY_ASSIGNMENT, fieldId: 'issueinventorynumber'});
            let binnumber = currentRecord.getCurrentSublistValue({sublistId: Sublist.INVENTORY_ASSIGNMENT, fieldId: 'binnumber'});
            if((scriptContext.fieldId === 'issueinventorynumber' && issueinventorynumber) || (scriptContext.fieldId === 'binnumber' && binnumber)) {
                let dataLineSelect = window.ScvObjDataLineSelect || {};
                let {inventoryStatusId, inventoryStatusDisplay} = dataLineSelect;//invNumberId, binNumberId,
                try {
                    Listinventorystatus(this);
                    setTimeout(() => {
                        const typeTrans = window?.parent?.nlapiGetFieldValue('type');
                        //chi item receipt moi uu tien status mac dinh cua location, cac type khac giu nguyen
                        let objStatusDefault = typeTrans === TRANSACTION_TYPE.ITEM_RECEIPT ? getDefaultReceiptStatusOfLocation(getLineLocationId()) : null;
                        if (objStatusDefault) {
                            currentRecord.setCurrentSublistValue({
                                sublistId: Sublist.INVENTORY_ASSIGNMENT,
                                fieldId: 'inventorystatus',
                                value: objStatusDefault.value
                            });
                            setTarget(objStatusDefault.text, objStatusDefault.value);
                        } else if (inventoryStatusId && inventoryStatusDisplay) {//issueinventorynumber === String(invNumberId) && (!binnumber || (binnumber === String(binNumberId))) &&
                            currentRecord.setCurrentSublistValue({
                                sublistId: Sublist.INVENTORY_ASSIGNMENT,
                                fieldId: 'inventorystatus',
                                value: inventoryStatusId
                            });
                            setTarget(inventoryStatusDisplay, inventoryStatusId);
                        } else {
                            setTargetDefaultInventoryStatus();
                        }
                    }, 1000);
                }  catch (e) {
                    //Khong co Listinventorystatus
                }
            }
            
            if(scriptContext.fieldId === 'quantityavailable' || scriptContext.fieldId === 'lotquantityavailable') {
                let quantityAvailable = currentRecord.getCurrentSublistValue({
                    sublistId: Sublist.INVENTORY_ASSIGNMENT,
                    fieldId: 'quantityavailable'
                });
                if (quantityAvailable > 0) {
                    let quantity = currentRecord.getValue('quantity');
                    let totalQuantityLine = getTotalExcludedLines(currentRecord, Sublist.INVENTORY_ASSIGNMENT, scriptContext.lineNum);
                    if(quantity > totalQuantityLine) {
                        let quantityToSet = quantity - totalQuantityLine;
                        quantityToSet = quantityToSet > quantityAvailable ? quantityAvailable : quantityToSet;
                        currentRecord.setCurrentSublistValue({
                            sublistId: Sublist.INVENTORY_ASSIGNMENT,
                            fieldId: 'quantity',
                            value: Number(quantityToSet.toFixed(8))
                        });
                    }
                }
            }
        }
        
        const getTotalExcludedLines = (currentRecord, sublistId, lineNum) => {
            let totalQuantity = 0;
            const lineCount = currentRecord.getLineCount({sublistId: sublistId});
            for (let i = 0; i < lineCount; i++) {
                if (i !== lineNum) {
                    totalQuantity += currentRecord.getSublistValue({
                        sublistId: sublistId,
                        fieldId: 'quantity',
                        line: i
                    });
                }
            }
            return totalQuantity;
        }
        
        const getOnclickValuesInInnerPopup = () => {
            const container = document.getElementById('inner_popup_div');
            if (!container) {
                return [];
            }
            
            const links = container.querySelectorAll('a');
            const onclickValues = [];
            
            links.forEach(link => {
                const onclickAttr = link.getAttribute('onclick');
                if (onclickAttr) {
                    onclickValues.push(onclickAttr);
                }
            });
            
            return onclickValues;
        }
        
        const extractSetTargetParams = (onclickString) => {
            const regex = /setTarget\('([^']*)','([^']*)'\)/;
            const match = onclickString.match(regex);
            
            if (match) {
                const param1 = match[1];
                const param2 = match[2];
                return { param1, param2 };
            } else {
                // Không match được
                return null;
            }
        }
        
        /**
         * Des: Lấy location của line item receipt đang mở inventory detail
         * @returns {string} internal id của location
         */
        const getLineLocationId = () => {
            let urlParams = new URLSearchParams(window.location.search);
            let locationId = urlParams.get('location') || window.nlapiGetFieldValue('location') || '';
            if (!locationId) {
                let sublistIdParent = window.parent.nlapiGetFieldValue('type') === TRANSACTION_TYPE.ASSEMBLY_BUILD ? Sublist.COMPONENT : Sublist.ITEM;
                locationId = window.parent.nlapiGetCurrentLineItemValue(sublistIdParent, 'location') || '';
            }
            return locationId;
        };

        /**
         * Des: Lấy inventory status mặc định khi nhận hàng của location (có cache theo location)
         * @param locationId {string}
         * @returns {{value: string, text: string}|null}
         */
        const getDefaultReceiptStatusOfLocation = (locationId) => {
            if (!locationId) return null;
            window.SCV = window.SCV || {};
            window.SCV.defaultReceiptStatus = window.SCV.defaultReceiptStatus || {};
            if (window.SCV.defaultReceiptStatus.hasOwnProperty(locationId)) {
                return window.SCV.defaultReceiptStatus[locationId];
            }

            let objStatus;
            try {
                let fieldOfLocation = search.lookupFields({
                    type: search.Type.LOCATION,
                    id: locationId,
                    columns: ['custrecord_scv_loc_defaultreceiptstatus']
                });
                objStatus = extractDefaultReceiptStatus(fieldOfLocation);
            } catch (e) {
                //khong lookup duoc tu client -> lay qua suitelet
                objStatus = getDefaultReceiptStatusFromSuitelet(locationId);
            }
            window.SCV.defaultReceiptStatus[locationId] = objStatus;
            return objStatus;
        };

        /**
         * Des: Lay {value, text} tu ket qua lookup truong custrecord_scv_loc_defaultreceiptstatus
         * @param fieldOfLocation {Object}
         * @returns {{value: string, text: string}|null}
         */
        const extractDefaultReceiptStatus = (fieldOfLocation) => {
            let objField = (fieldOfLocation?.custrecord_scv_loc_defaultreceiptstatus || [])[0];
            return objField?.value ? {value: objField.value, text: objField.text} : null;
        };

        /**
         * Des: Goi suitelet lay inventory status mac dinh khi nhan hang cua location
         * @param locationId {string}
         * @returns {{value: string, text: string}|null}
         */
        const getDefaultReceiptStatusFromSuitelet = (locationId) => {
            try {
                let resCall = window.nlapiRequestURL('/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_loc_def_status&deploy=customdeploy_scv_sl_loc_def_status', {location: locationId});
                if (resCall.code !== 200) return null;
                return extractDefaultReceiptStatus(JSON.parse(resCall.getBody()));
            } catch (e) {
                //khong goi duoc suitelet
                return null;
            }
        };

        /**
         * Des: Danh sach cac line da duoc set inventory status mac dinh (danh dau tren client)
         * @returns {Object}
         */
        const getLinesMarkedDefaultStatus = () => {
            window.SCV = window.SCV || {};
            window.SCV.linesSetDefaultStatus = window.SCV.linesSetDefaultStatus || {};
            return window.SCV.linesSetDefaultStatus;
        };

        /**
         * Des: Clear line dang nhap do dang cua machine inventory detail khi moi vao trang
         */
        const clearLineInventoryDetail = () => {
            const typeTrans = window?.parent?.nlapiGetFieldValue('type');
            if (typeTrans !== TRANSACTION_TYPE.ITEM_RECEIPT) return;

            try {
                window.machines.inventorydetail.clearline();
            } catch (e) {
                //khong co machine inventorydetail
            }
        };

        /**
         * Des: Key danh dau line hien tai, line moi chua commit lay theo vi tri se duoc them vao
         * @param currentRecord {Record}
         * @returns {string}
         */
        const getCurrentLineKey = (currentRecord) => {
            let lineIndex = currentRecord.getCurrentSublistIndex({sublistId: Sublist.INVENTORY_ASSIGNMENT});
            if (lineIndex === null || lineIndex === undefined || Number(lineIndex) < 0) {
                lineIndex = currentRecord.getLineCount({sublistId: Sublist.INVENTORY_ASSIGNMENT});
            }
            return String(lineIndex);
        };

        /**
         * Des: Danh dau lai toan bo cac line da co inventory status sau khi commit/insert/remove line
         *      (build lai theo index hien tai de tranh lech dau khi xoa line)
         * @param currentRecord {Record}
         */
        const markLinesHasInventoryStatus = (currentRecord) => {
            let linesMarked = {};
            const lineCount = currentRecord.getLineCount({sublistId: Sublist.INVENTORY_ASSIGNMENT});
            for (let i = 0; i < lineCount; i++) {
                let statusOfLine = currentRecord.getSublistValue({
                    sublistId: Sublist.INVENTORY_ASSIGNMENT,
                    fieldId: 'inventorystatus',
                    line: i
                });
                if (statusOfLine) {
                    linesMarked[String(i)] = statusOfLine;
                }
            }
            window.SCV = window.SCV || {};
            window.SCV.linesSetDefaultStatus = linesMarked;
        };

        /**
         * Function to be executed when a sublist line is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {
            if (scriptContext.sublistId !== Sublist.INVENTORY_ASSIGNMENT) return;
            const typeTrans = window?.parent?.nlapiGetFieldValue('type');
            if (typeTrans !== TRANSACTION_TYPE.ITEM_RECEIPT) return;

            let currentRecord = scriptContext.currentRecord;
            //chi xu ly line chua co du lieu (line moi), line da luu thi giu nguyen
            let recordId = currentRecord.getCurrentSublistValue({
                sublistId: Sublist.INVENTORY_ASSIGNMENT,
                fieldId: 'internalid'
            });
            if (recordId) return;

            //line da duoc set/chon status roi thi khong set lai nua
            let linesMarked = getLinesMarkedDefaultStatus();
            let lineKey = getCurrentLineKey(currentRecord);
            if (linesMarked[lineKey]) return;

            let objStatus = getDefaultReceiptStatusOfLocation(getLineLocationId());
            if (!objStatus) return;

            currentRecord.setCurrentSublistValue({
                sublistId: Sublist.INVENTORY_ASSIGNMENT,
                fieldId: 'inventorystatus',
                value: objStatus.value
            });
            try {
                setTarget(objStatus.text, objStatus.value);
            } catch (e) {
                //khong co setTarget
            }
        }

        /**
         * Function to be executed when a sublist line is committed/inserted/removed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.operation - The operation performed on the line
         *
         * @since 2016.1
         */
        function sublistChanged(scriptContext) {
            if (scriptContext.sublistId !== Sublist.INVENTORY_ASSIGNMENT) return;
            const typeTrans = window?.parent?.nlapiGetFieldValue('type');
            if (typeTrans !== TRANSACTION_TYPE.ITEM_RECEIPT) return;

            //line da commit co status -> danh dau lai de lineInit khong set lai giá tri mac dinh
            markLinesHasInventoryStatus(scriptContext.currentRecord);
        }

        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {

        }
        
        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */
        function saveRecord(scriptContext) {
            
            return true;
        }
        
        return {
            pageInit: pageInit,
            lineInit: lineInit,
            sublistChanged: sublistChanged,
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
        
    });
