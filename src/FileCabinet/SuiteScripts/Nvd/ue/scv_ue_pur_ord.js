/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  22 Jan 2025         Khanh Tran              Quy tắc sinh số chứng từ trên màn hình PR,PO, from Mr.Hải(https://app.clickup.com/t/86cxqgxy8)
 *  25 Apr 2025         Khanh Tran	    		Tính giá cơ sở của Item chuẩn và Item lệch chuẩn theo Conversion Rate, from ms.Ngọc(https://app.clickup.com/t/86cx3r94u)
 *  18 Apr 2025         Khanh Tran	 	        Phát triển tính các giá trị trên PO, ITR, IB from Ms.Kỳ(https://app.clickup.com/t/86cyknytj)
 *  26 May 2025         Khanh Tran              Chức năng kế thừa Ori Line ID từ PO sang WO, from mr.Huy(https://app.clickup.com/t/86cz1855m)
 *  */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/url', 'N/runtime', 'N/search', 'N/record',
    '../cons/scv_cons_payreq', '../cons/scv_cons_seqnumber',
    '../cons/scv_cons_calc_base_price.js',
    '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_approvalstatus.js',
    '../cons/scv_cons_tolerance_values.js',

    '../cons/scv_cons_search_set_oriline_wo.js',
],

    (url, runtime, search, record,
        ConsPayReq, constSeqNumber,
        constCalcBasePrice,
        constOrderType,
        constAprStatus,
        constTolVal,

        cSearchSetOrilineWo
    ) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            const triggerType = scriptContext.type;
            if (triggerType === 'view') {
                let form = scriptContext.form;
                let newRecord = scriptContext.newRecord;
                addBtnCreateIQC(form, newRecord);
                addBtnDNTT(form, newRecord);
                addBtnDNTU(form, newRecord);
            }
        }

        const addBtnDNTT = (form, newRecord) => {
            let empId = newRecord.getValue('employee') || '';
            let empPrepayemnt = newRecord.getValue('custbody_scv_po_emp_prepayment');
            const orderstatus = newRecord.getValue('approvalstatus');
            const STATUS_APPROVED = '2';
            const status = newRecord.getValue('status');
            if(status === 'Closed' || status === 'Fully Billed') return;
            if (orderstatus !== STATUS_APPROVED) return;
            let blEmpPrepayemnt = empPrepayemnt === 'T' || empPrepayemnt == true;
            if (blEmpPrepayemnt) return;
            let urlLink = url.resolveRecord({recordType: ConsPayReq.CustomRecordType.PAYMENT_REQUEST, recordId: null, params: {createFromType: newRecord.type, createFromId: newRecord.id, btnid: ConsPayReq.CustomButtonId.DNTT}});
            urlLink += `&empid=${empId}`;
            form.addButton({
                id: 'custpage_btn_dntt',
                label: 'DNTT',
                functionName: `window.location.replace('${urlLink}')`
            });
        }

        const addBtnDNTU = (form, newRecord) => {
            let empId = newRecord.getValue('employee') || '';
            const orderstatus = newRecord.getValue('approvalstatus');
            const STATUS_APPROVED = '2';
            if (orderstatus !== STATUS_APPROVED) return;
            let empPrepayemnt = newRecord.getValue('custbody_scv_po_emp_prepayment');
            const blEmpPrepayemnt = empPrepayemnt === 'T' || empPrepayemnt == true;
            if (!blEmpPrepayemnt) return;
            let remainAmt = newRecord.getValue('custbody_scv_remaining_po')*1;
            if (remainAmt <= 0) return;
            const status = newRecord.getValue('status');
            if(status === 'Closed' || status === 'Fully Billed') return;
            let urlLink = url.resolveRecord({recordType: ConsPayReq.CustomRecordType.PAYMENT_REQUEST, recordId: null, params: {createFromType: newRecord.type, createFromId: newRecord.id, btnid: ConsPayReq.CustomButtonId.DNTU}});
            urlLink += `&empid=${empId}`;
            urlLink += `&remainAmt=${remainAmt}`;
            form.addButton({
                id: 'custpage_btn_dntu',
                label: 'DNTU',
                functionName: `window.location.replace('${urlLink}')`
            });
        }

        const addBtnCreateIQC = (form, newRecord) => {
            if (!isShowBtnToIQC(newRecord)) return;
            const slUrl = url.resolveScript({
                scriptId: "customscript_scv_sl_po_create_iqc",
                deploymentId: "customdeploy_scv_sl_po_create_iqc",
                params: {poid: newRecord.id, trtype: newRecord.type}
            });
            form.addButton({
                id: "custpage_btn_iqc",
                label: "To IQC",
                functionName: "let isConfirm = confirm('Are you sure create IQC?'); if(isConfirm) window.location.replace('" + slUrl + "')"
            });
        }

        const isShowBtnToIQC = (newRecord) => {
            let isShow = false;
            const lc = newRecord.getLineCount("item");
            for (let i = 0; i < lc; i++) {
                if (!newRecord.setSublistValue("item", "custcol_scv_inspection_number", i)) {
                    isShow = true;
                    break;
                }
            }
            return isShow;
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {  
            let triggerType = scriptContext.type;
            let newRec = scriptContext.newRecord;
            constSeqNumber.genPurOrdDocNumber(scriptContext);
            if(triggerType == 'create' && runtime.executionContext !== runtime.ContextType.USER_INTERFACE){
                constTolVal.updateRecordWithTolerance(newRec);
            }

            if(["create", "edit"].includes(triggerType)){
                if(newRec.getValue('custbody_scv_order_type') == constOrderType.RECORDS.MUA_BAN_NOI_BO.ID){
                    constCalcBasePrice.updateRecordWithBasePrices(scriptContext);
                }
            }
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            let triggerType = scriptContext.type;
            let newRec = scriptContext.newRecord;

            if (triggerType === 'edit') {
                setOrilineIdToWos(newRec, scriptContext.oldRecord);
            }
        }

        const setOrilineIdToWos = (newRec, oldRec) => {
            let approval_status = newRec.getValue('custbody_scv_approval_status') * 1;
            if(!approval_status || approval_status !== constAprStatus.RECORDS.APPROVED.ID) return;
            if(newRec.getValue('custbody_scv_order_type')*1 !== constOrderType.RECORDS.MUA_HANG_GIA_CONG.ID) return;
            if(approval_status === oldRec.getValue('custbody_scv_approval_status') * 1) return;

            let arrWo = cSearchSetOrilineWo.getDataSource([
                search.createFilter({name: 'internalid', operator: 'anyof', values: newRec.id})
            ]);
            arrWo.forEach(obj => {
                if(!obj.wo && !obj.oriline_id) return;
                try {
                    record.submitFields({
                        type: 'workorder',
                        id: obj.wo * 1,
                        values: {
                            custbody_scv_oriline_id : obj.oriline_id,
                        },
                        options: {
                            enableSourcing: false, ignoreMandatoryFields : true
                        }
                    });
                } catch (error) {
                    log.error('updWO', error);
                    log.error('data', obj);
                }
            })
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
