/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Nov 2024         Huy Pham                Init & create file, Sinh số lô tự động trong màn hình WO, from mr.Bính(https://app.clickup.com/t/86cx2y1j1)
 *  26 Nov 2024         Huy Pham                Đổi logic đánh số lô, from mr.Bính(https://app.clickup.com/t/86cx2y1j1?comment=90160075747267)
 *  16 Dec 2024         Huy Pham                Sinh số chứng chỉ chất lượng, from mr.NĐHuy(https://app.clickup.com/t/86cxax85q)
 *  22 Jan 2025         Khanh Tran              Quy tắc sinh số chứng từ trên màn hình PR,PO, from Mr.Hải(https://app.clickup.com/t/86cxqgxy8)
 *  14 Mar 2025         Huy Pham                Updatde Sinh số lô tự động, from mr.Phúc(https://app.clickup.com/t/86cx2y1j1?comment=90160097650803)
 */
define(['N/search', 'N/record', 'N/query',
    '../lib/scv_lib_function',

    '../cons/scv_cons_search.js',
    '../cons/scv_cons_format.js',

    '../cons/scv_cons_qc_approvalstatus.js',
    '../cons/scv_cons_ordertype.js',
    '../cons/scv_cons_work_order_type.js'
],
    function(search, record, query,
        lbf,

        constSearch,
        constFormat,

        constQCApprovalStatus,
        constOrderType,
        constWorkOrderType
    ) {
        const TYPE = "customrecord_scv_rcnumber";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            
        }
    
        const RECORDS = {
        }

        const SEQUENCE_TYPE = {
            INVENTORY_LOTNUMBER: "INVENTORYLOTNUMBER",
            WORKORDER_THONGKE_SX: "WORKORDER_THONGKESANXUAT",
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customrecord_scv_rcnumber",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid",
                    "name", "custrecord_scv_rcn_subsidiary",
                    "custrecord_scv_rcn_type", "custrecord_scv_rcn_accountnumber",
                    "custrecord_scv_rcn_yearmonth", "custrecord_scv_rcn_prefix",
                    "custrecord_scv_rcn_currentnumber"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "name", "custrecord_scv_rcn_subsidiary",
                    "custrecord_scv_rcn_type", "custrecord_scv_rcn_accountnumber",
                    "custrecord_scv_rcn_yearmonth", "custrecord_scv_rcn_prefix",
                    "custrecord_scv_rcn_currentnumber"
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

        const formatDatePrefix_YYMM = (_date) =>{
            return _date.getFullYear().toString().substring(2,4) + ((_date.getMonth() + 1) + '').padStart(2,'0');
        }

        const genAssemblyLotNumber = (curRec) =>{
            let assemblyLotNo = curRec.getValue("custbody_scv_assembly_lot");
            if(!!assemblyLotNo) return null;

            let prefix_zzzz = curRec.getValue("custbody_scv_qc_serial_code") + "";
            if(!!prefix_zzzz){
                prefix_zzzz = prefix_zzzz.padStart(4, "0");
            }

            let today = new Date();
            let prefix_yymm = formatDatePrefix_YYMM(today);

            let seqType = SEQUENCE_TYPE.INVENTORY_LOTNUMBER;
            let currentNumber = 1;

            let objRes = {
                name: seqType + prefix_yymm,
                custrecord_scv_rcn_currentnumber: currentNumber,
                custbody_scv_assembly_lot: ""
            }

            let arrSeqNumber = getDataSource([
                search.createFilter({
                    name: 'custrecord_scv_rcn_type', 
                    operator: "is", 
                    values: seqType
                }),
                search.createFilter({
                    name: 'custrecord_scv_rcn_yearmonth', 
                    operator: "is", 
                    values: prefix_yymm
                }),
            ]);

            if(arrSeqNumber.length  == 0){
                let seqNumRec = record.create({type: "customrecord_scv_rcnumber", isDynamic: true});
                seqNumRec.setValue("name", objRes.name);
                seqNumRec.setValue("custrecord_scv_rcn_type", seqType);
                seqNumRec.setValue("custrecord_scv_rcn_yearmonth", prefix_yymm);
                seqNumRec.setValue("custrecord_scv_rcn_currentnumber", currentNumber);
                seqNumRec.save({enableSourcing: false, ignoreMandatoryFields: false});
            }
            else{
                let objSeqNumber = arrSeqNumber[0];

                currentNumber = objSeqNumber.custrecord_scv_rcn_currentnumber * 1;
                currentNumber += 1;

                submitCurrentSequenceNumber(objSeqNumber.internalid, currentNumber);
            }

            if(!!prefix_zzzz){
                objRes.custbody_scv_assembly_lot = prefix_zzzz + "_";
            }
            objRes.custbody_scv_assembly_lot += prefix_yymm + currentNumber.toString().padStart(5, '0');

            curRec.setValue("custbody_scv_assembly_lot", objRes.custbody_scv_assembly_lot);

            return objRes;
        }

        const genNumberChungChiChatLuong = (curRec) => {
            let yccc_status = curRec.getValue("custrecord_scv_yccc_status");
            if(yccc_status != constQCApprovalStatus.RECORDS.APPROVED.ID) return null;

            let cc_date = curRec.getValue("custrecord_scv_yccc_cc_date");
            if(!cc_date) return null;
            
            let name = curRec.getValue("name");

            let regexOfName = /^[^/]+\/\d{2}\/\d{2}$/;
            if(regexOfName.test(name)) return null;

            let infoDate = constFormat.getInfoDate(cc_date);

            let prefix_yymm = infoDate.yy.toString() + infoDate.mm.toString();
            let seqType = curRec.type.toUpperCase();
            let currentNumber = 1;

            let arrSeqNumber = getDataSource([
                search.createFilter({
                    name: 'custrecord_scv_rcn_type', 
                    operator: "is", 
                    values: seqType
                }),
                search.createFilter({
                    name: 'custrecord_scv_rcn_yearmonth', 
                    operator: "is", 
                    values: prefix_yymm
                }),
            ]);

            if(arrSeqNumber.length  == 0){
                let seqNumRec = record.create({type: "customrecord_scv_rcnumber", isDynamic: true});
                seqNumRec.setValue("name", seqType + prefix_yymm);
                seqNumRec.setValue("custrecord_scv_rcn_type", seqType);
                seqNumRec.setValue("custrecord_scv_rcn_yearmonth", prefix_yymm);
                seqNumRec.setValue("custrecord_scv_rcn_currentnumber", currentNumber);
                seqNumRec.save({enableSourcing: false, ignoreMandatoryFields: false});
            }
            else{
                let objSeqNumber = arrSeqNumber[0];

                currentNumber = objSeqNumber.custrecord_scv_rcn_currentnumber * 1;
                currentNumber += 1;

                submitCurrentSequenceNumber(objSeqNumber.internalid, currentNumber);
            }

            name = currentNumber.toString().padStart(5, '0') + "/" + infoDate.mm + "/" + infoDate.yy;

            curRec.setValue("name", name);

            return name;
        }

        const submitCurrentSequenceNumber = (_id, _seqNum) =>{
            let nextNum;
            let success = false;

            while(!success) {
                try {
                    let recTrans = record.load({
                        type: 'customrecord_scv_rcnumber',
                        id: _id,
                        isDynamic: false
                    });

                    let currentNum = parseInt(recTrans.getValue('custrecord_scv_rcn_currentnumber'), 10) || 0;
                    nextNum = currentNum + 1;

                    recTrans.setValue({
                        fieldId: 'custrecord_scv_rcn_currentnumber',
                        value: nextNum
                    });

                    recTrans.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });

                    success = true; // success → break loop
                } catch (e) {
                    log.error(e);
                    if (e.name === 'RCRD_HAS_BEEN_CHANGED') {
                        // Another process saved at the same time → retry
                        log.debug('Retrying sequence fetch', e.message);
                    } else {
                        throw e; // unexpected error → bubble up
                    }
                }
            }

            return _seqNum;

            // comment lại phần dưới, vì đã xử lý trong while
            // record.submitFields({
            //     type: 'customrecord_scv_rcnumber',
            //     id: _id,
            //     values: {
            //         custrecord_scv_rcn_currentnumber: _seqNum
            //     },
            //     options: {
            //         enableSourcing: false, ignoreMandatoryFields : true
            //     }
            // });
        }

        const isGenPurReqDocNumber = (scriptContext) => {
            let triggerType = scriptContext.type;log.error('triggerType', triggerType)
            if(!['create', 'edit', 'xedit'].includes(triggerType)) return false;

            let curRec = scriptContext.newRecord;
            let orderType = curRec.getValue("custbody_scv_order_type") * 1; 
            if(orderType == constOrderType.RECORDS.MUA_HANG_THEO_KE_HOACH.ID) return false;
            
            let trandate = curRec.getValue('trandate');
            if(!trandate) return false;
            let trandate_yyyymmdd = constFormat.dateToChar(trandate, "YYYYMMDD");

            let subsidiary = curRec.getValue('subsidiary');
            if(!subsidiary) return false;
            // if(subsidiary != 5 && subsidiary != 7) return false;

            let department = curRec.getValue('department');
            if(!department) return false;

            if(triggerType == 'edit' || triggerType == 'xedit'){
                let oldRec = scriptContext.oldRecord;
                let old_trandate = oldRec.getValue('trandate');
                let old_trandate_yyyymmdd = constFormat.dateToChar(old_trandate, "YYYYMMDD");
                if(subsidiary == oldRec.getValue('subsidiary') && department == oldRec.getValue('department') && trandate_yyyymmdd == old_trandate_yyyymmdd) return false;
            }
            
            return true;
        }

        const getDataDepartment = (curRec) => {
            let depId = curRec.getValue('department');
            let objDep = search.lookupFields({type: 'department', id: depId, columns: ['custrecord_scv_dep_short_name']});
            let short_name = objDep.custrecord_scv_dep_short_name;
            return {depId, short_name}
        }
    
        const getDataSubsidiary = (curRec) => {
            let subId = curRec.getValue('subsidiary');
            let objSub = search.lookupFields({type: 'subsidiary', id: subId, columns: ['tranprefix']});
            let tranprefix = objSub.tranprefix;
            return {subId, tranprefix}
        }

        const getDataEntity = (curRec) => {
            let entityId = curRec.getValue('entity');
            let objSub = search.lookupFields({type: "entity", id: entityId, columns: ['custentity_scv_vendor_abbreviation']});
            let abbreviation = objSub.custentity_scv_vendor_abbreviation;
            return {entityId, abbreviation}
        }
    
        const getInfoDate = (curRec) => {
            let trandate = curRec.getValue('trandate');
            let yy = constFormat.getYY(trandate);
            let mm = constFormat.getMM(trandate);
            return {
                trandate, mm, yy
            };
        }
        
        const genPurReqDocNumber = (scriptContext) => {
            let isRun = isGenPurReqDocNumber(scriptContext);log.error('isRun', isRun)
            if(!isRun) return;
    
            let curRec = scriptContext.newRecord;
            let objSub = getDataSubsidiary(curRec);
            let objDep = getDataDepartment(curRec);
            let objDate = getInfoDate(curRec);
            let currentNumber = 1;
            let arrSeqNumber = getDataSource([
                search.createFilter({
                    name: 'custrecord_scv_rcn_type',  operator: 'is',  values: curRec.type
                }),
                search.createFilter({
                    name: 'custrecord_scv_rcn_yearmonth', operator: 'is',  values: objDate.mm + objDate.yy
                }),
                search.createFilter({
                    name: 'custrecord_scv_rcn_subsidiary', operator: 'anyof',  values: objSub.subId
                }),
                search.createFilter({
                    name: 'custrecord_scv_rcn_prefix', operator: 'is',  values: objDep.short_name
                }),
            ]);

            if(arrSeqNumber.length == 0){
                let seqNumRec = record.create({type: "customrecord_scv_rcnumber", isDynamic: true});
                seqNumRec.setValue("name", (curRec.type + objDate.mm + objDate.yy + objSub.tranprefix + objDep.short_name).toUpperCase());
                seqNumRec.setValue("custrecord_scv_rcn_type", curRec.type);
                seqNumRec.setValue("custrecord_scv_rcn_yearmonth", objDate.mm + objDate.yy);
                seqNumRec.setValue("custrecord_scv_rcn_subsidiary", objSub.subId);
                seqNumRec.setValue("custrecord_scv_rcn_prefix", objDep.short_name);
                seqNumRec.setValue("custrecord_scv_rcn_currentnumber", currentNumber);
                seqNumRec.save({enableSourcing: false, ignoreMandatoryFields: false});
            }
            else{
                let objSeqNumber = arrSeqNumber[0];
                currentNumber = objSeqNumber.custrecord_scv_rcn_currentnumber * 1;
                currentNumber += 1;
                submitCurrentSequenceNumber(objSeqNumber.internalid, currentNumber);
            }

            let tranid = currentNumber.toString().padStart(3, '0') + objDate.mm + objDate.yy + objSub.tranprefix + objDep.short_name;
            curRec.setValue("tranid", tranid);
        }

        const isGenPurOrdDocNumber = (scriptContext) => {
            let triggerType = scriptContext.type;
            if(!['create', 'edit'].includes(triggerType)) return false;

            let curRec = scriptContext.newRecord;
            let trandate = curRec.getValue('trandate');
            if(!trandate) return false;

            let subsidiary = curRec.getValue('subsidiary');
            if(!subsidiary) return false;
            // if(subsidiary != 5 && subsidiary != 7) return false;

            let entity = curRec.getValue('entity');
            if(!entity) return false;

            if(triggerType =='edit'){
                let oldRec = scriptContext.oldRecord;
                if(subsidiary == oldRec.getValue('subsidiary') && entity == oldRec.getValue('entity')) return false;
                
            }
            
            return true;
        }

        const genPurOrdDocNumber = (scriptContext) => {
            let isRun = isGenPurOrdDocNumber(scriptContext);
            if(!isRun) return;

            let curRec = scriptContext.newRecord;
            let objSub = getDataSubsidiary(curRec);
            let objEntity = getDataEntity(curRec);
            let objDate = getInfoDate(curRec);
            let phu_luc = curRec.getValue("custbody_scv_phu_luc");
            let currentNumber = 1;
            let arrSeqNumber = getDataSource([
                search.createFilter({
                    name: 'custrecord_scv_rcn_type',  operator: 'is',  values: curRec.type
                }),
                search.createFilter({
                    name: 'custrecord_scv_rcn_yearmonth', operator: 'is',  values: objDate.yy
                }),
                search.createFilter({
                    name: 'custrecord_scv_rcn_subsidiary', operator: 'anyof',  values: objSub.subId
                }),
                search.createFilter({
                    name: 'custrecord_scv_rcn_prefix', operator: 'is',  values: objEntity.abbreviation
                }),
            ]);

            if(arrSeqNumber.length == 0){
                let seqNumRec = record.create({type: "customrecord_scv_rcnumber", isDynamic: true});
                seqNumRec.setValue("name", (curRec.type + objDate.yy + objSub.tranprefix + objEntity.abbreviation).toUpperCase());
                seqNumRec.setValue("custrecord_scv_rcn_type", curRec.type);
                seqNumRec.setValue("custrecord_scv_rcn_yearmonth", objDate.yy);
                seqNumRec.setValue("custrecord_scv_rcn_subsidiary", objSub.subId);
                seqNumRec.setValue("custrecord_scv_rcn_prefix", objEntity.abbreviation);
                seqNumRec.setValue("custrecord_scv_rcn_currentnumber", currentNumber);
                seqNumRec.save({enableSourcing: false, ignoreMandatoryFields: false});
            }
            else{
                let objSeqNumber = arrSeqNumber[0];
                currentNumber = objSeqNumber.custrecord_scv_rcn_currentnumber * 1;
                currentNumber += 1;
                submitCurrentSequenceNumber(objSeqNumber.internalid, currentNumber);
            }

            let tranid = objDate.yy + objSub.tranprefix + objEntity.abbreviation + currentNumber.toString().padStart(3, '0');
            if(phu_luc) tranid += "-" + phu_luc;

            curRec.setValue("tranid", tranid);
        }

        const genTransactionNumber = (scriptContext) => {
            let curRec = scriptContext.newRecord;
            let oldRecord = scriptContext.oldRecord;
            let triggerType = scriptContext.type;

            if(!['create', 'edit', 'xedit'].includes(triggerType)) return;

            let isCreateTranId = shouldCreateTransactionNumber(curRec, oldRecord, triggerType);
            log.error('isCreateTranId', isCreateTranId);
            // let isCreateTranId = true;
            if(!!isCreateTranId) {
                let objPrefix = getDataTransactionPrefix(curRec);
                log.error('objPrefix', objPrefix);

                let tranprefix = objPrefix.tranprefix ;
                let transubprefix = objPrefix.transubprefix ;
                if(!tranprefix) return;

                let objSub = getDataSubsidiary(curRec);
                let objDate = getInfoDate(curRec);
                let dateprexfix = (transubprefix + objDate.yy + objDate.mm);

                let currentNumber = 1;
                let arrSeqNumber = getDataSource([
                    search.createFilter({
                        name: 'custrecord_scv_rcn_type',  operator: 'is',  values: curRec.type
                    }),
                    search.createFilter({
                        name: 'custrecord_scv_rcn_yearmonth', operator: 'is',  values: dateprexfix
                    }),
                    search.createFilter({
                        name: 'custrecord_scv_rcn_subsidiary', operator: 'anyof',  values: objSub.subId
                    }),
                    search.createFilter({
                        name: 'custrecord_scv_rcn_prefix', operator: 'is',  values: tranprefix
                    }),
                ]);

                if(arrSeqNumber.length == 0){
                    let name = (curRec.type + dateprexfix + objSub.tranprefix + tranprefix).toUpperCase()

                    let seqNumRec = record.create({type: "customrecord_scv_rcnumber", isDynamic: true});
                    seqNumRec.setValue("name", name);
                    seqNumRec.setValue("custrecord_scv_rcn_type", curRec.type);
                    seqNumRec.setValue("custrecord_scv_rcn_yearmonth", dateprexfix);
                    seqNumRec.setValue("custrecord_scv_rcn_subsidiary", objSub.subId);
                    seqNumRec.setValue("custrecord_scv_rcn_prefix", tranprefix);
                    seqNumRec.setValue("custrecord_scv_rcn_currentnumber", currentNumber);
                    seqNumRec.save({enableSourcing: false, ignoreMandatoryFields: false});
                }
                else{
                    let objSeqNumber = arrSeqNumber[0];
                    currentNumber = objSeqNumber.custrecord_scv_rcn_currentnumber * 1;
                    currentNumber += 1;
                    currentNumber = submitCurrentSequenceNumber(objSeqNumber.internalid, currentNumber);
                }

                let tranid = tranprefix + objSub.tranprefix + dateprexfix + "." + currentNumber;
                log.error('newly created tranid', tranid);
                curRec.setValue("tranid", tranid);
            }
        }

        const getDataTransactionPrefix = (curRec) => {
            let recType = curRec.type;
            let sqlQuery = `SELECT 
                id, custrecord_scv_tp_prefix, custrecord_scv_tp_type
            FROM customrecord_scv_tran_prefix
            WHERE custrecord_scv_tp_type = '${recType}' AND isinactive = 'F'`;

            let resultSQL = query.runSuiteQL({
                query: sqlQuery
            }).asMappedResults();

		    let tranprefix = resultSQL.length > 0 ? resultSQL[0].custrecord_scv_tp_prefix : "";
            let transubprefix = "";

            if(recType === "itemfulfillment") {
                let createdfrom = curRec.getValue("createdfrom");
                let createdfromType = lbf.getTranRecordType(createdfrom);
                if(createdfromType === "salesorder") {
                    transubprefix = "X";
                }
            }
            return { tranprefix, transubprefix };
        }

        const shouldCreateTransactionNumber = (curRec, oldRecord, triggerType) => {
            if(triggerType === "create") return true;

            if(triggerType === "edit" || triggerType === "xedit") {
                let trandate = curRec.getValue("trandate");
                let oldTrandate = oldRecord.getValue("trandate");
                // // trường hợp tự sinh phiếu bởi Netsuite, không có dấu '.'
                // let tranid = curRec.getValue("tranid");
                // if(!String(tranid).includes('.'))   return true

                let yearsDiff = trandate.getFullYear() - oldTrandate.getFullYear();
                let monthsDiff = trandate.getMonth() - oldTrandate.getMonth();
                let monthNumber = monthsDiff + (yearsDiff * 12);
                if(monthNumber !== 0 ) {
                    return true;
                }
            }

            return false;
        }
    
        const genSoThongKeSX = (curRec) =>{
            let soThongKeSX = curRec.getValue("custbody_scv_so_thong_ke_sx");
            if(!!soThongKeSX) return null;

            let workOrderTypeId = curRec.getValue("custbody_scv_work_order_type");
            let orderTypeId = curRec.getValue("custbody_scv_order_type");
            let qcSerialCode = "";

            let myFilters = [];

            if(!!curRec.id){
                myFilters.push(search.createFilter({
                    name: 'internalid', operator: "noneof", values: curRec.id
                }));
            }

            if(workOrderTypeId == constWorkOrderType.RECORDS.SX_ACP.ID
                && [
                    constOrderType.RECORDS.HANG_SX_THU_NGHIEM.ID,
                    constOrderType.RECORDS.HANG_SX_DANH_GIA.ID,
                    constOrderType.RECORDS.MUA_BAN_NOI_BO.ID,
                    constOrderType.RECORDS.SX_HANG_TON_KHO.ID,
                    constOrderType.RECORDS.SX_HANG_KHACH_DAT_NOI_DIA.ID,
                ].includes(orderTypeId * 1)
            ){
                //TH1
                qcSerialCode = curRec.getValue("custbody_scv_qc_serial_code");

                if(!!qcSerialCode){
                    myFilters.push(search.createFilter({
                        name: 'custbody_scv_qc_serial_code', operator: "is", values: qcSerialCode
                    }));
                }
                else{
                    myFilters.push(search.createFilter({
                        name: 'custbody_scv_qc_serial_code', operator: "isempty", values: ""
                    }));
                }
            }
            else if(workOrderTypeId == constWorkOrderType.RECORDS.SX_ACP.ID 
                && orderTypeId == constOrderType.RECORDS.SX_HANG_KHACH_DAT_XUAT_KHAU.ID)
            {
                //TH2
            }
            else if([
                    constWorkOrderType.RECORDS.SX_AC_LCN.ID,
                    constWorkOrderType.RECORDS.SX_MAU_AC_LCN.ID
                ].includes(workOrderTypeId * 1)
            )
            {
                //TH3
            }
            else{
                return null;
            }

            let trandate = curRec.getValue("trandate");
            let workCenterId = curRec.getValue("custbody_scv_work_center");
            let assemblyItemId = curRec.getValue("assemblyitem");
            let itemLKF = search.lookupFields({type: "item", id: assemblyItemId, columns: ["parent"]});
            let parentId = "";
            if(!!itemLKF.parent && itemLKF.parent.length > 0){
                parentId = itemLKF.parent[0].value;
            }

            myFilters.push(search.createFilter({
                name: 'trandate', operator: "on", values: constFormat.formatDate(trandate)
            }));
            
            myFilters.push(search.createFilter({
                name: 'parent', join: "item", operator: "anyof", values: !!parentId ? parentId : "@NONE@"
            }));
            myFilters.push(search.createFilter({
                name: 'custbody_scv_work_center', operator: "anyof", values: !!workCenterId ? workCenterId : "@NONE@"
            }));
            
            let resultSearch = constSearch.createSearchWithFilter({
                type: "workorder",
                filters: [
                    ["mainline","is","T"], 
                    "AND", 
                    ["taxline","is","F"]
                ],
                columns:
                [
                    search.createColumn({
                        name: "formulanumeric",
                        summary: "MAX",
                        formula: "TO_NUMBER(NVL({custbody_scv_so_thong_ke_sx},0))"
                    })
                ]
            }, myFilters);
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "custbody_scv_so_thong_ke_sx"
                ]);

                return objResTmpl;
            });
            
            let seqType = SEQUENCE_TYPE.WORKORDER_THONGKE_SX;
            let currentNumber = 1;

            let objRes = {
                name: seqType,
                custrecord_scv_rcn_currentnumber: currentNumber,
                custbody_scv_so_thong_ke_sx: ""
            }

            if(arrResult.length > 0){
                //Tìm không thấy thì sequence  = 0;
                currentNumber = arrResult[0].custbody_scv_so_thong_ke_sx * 1;
            }
            
            if(currentNumber == 0){
                currentNumber = 1;
                //tìm trong WO không thấy thì sẽ vào record Sequence Number
                let arrSeqNumber = getDataSource([
                    search.createFilter({
                        name: 'custrecord_scv_rcn_type', 
                        operator: "is", 
                        values: seqType
                    })
                ]);
                
                if(arrSeqNumber.length  == 0){
                    let seqNumRec = record.create({type: "customrecord_scv_rcnumber", isDynamic: true});
                    seqNumRec.setValue("name", objRes.name);
                    seqNumRec.setValue("custrecord_scv_rcn_type", seqType);
                    seqNumRec.setValue("custrecord_scv_rcn_currentnumber", currentNumber);
                    seqNumRec.save({enableSourcing: false, ignoreMandatoryFields: false});
                }
                else{
                    let objSeqNumber = arrSeqNumber[0];
    
                    currentNumber = objSeqNumber.custrecord_scv_rcn_currentnumber * 1;
                    currentNumber += 1;

                    if(currentNumber > 999){
                        currentNumber = 1;
                    }
    
                    submitCurrentSequenceNumber(objSeqNumber.internalid, currentNumber);
                }
            }

            if(currentNumber > 0){
                objRes.custbody_scv_so_thong_ke_sx = currentNumber.toString().padStart(3,"0");
            }

            objRes.custrecord_scv_rcn_currentnumber = currentNumber;

            curRec.setValue("custbody_scv_so_thong_ke_sx", objRes.custbody_scv_so_thong_ke_sx);

            return objRes;
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            genAssemblyLotNumber,
            genNumberChungChiChatLuong,
            genPurReqDocNumber,
            genPurOrdDocNumber,
            genTransactionNumber,
            genSoThongKeSX
        };
        
    });
    