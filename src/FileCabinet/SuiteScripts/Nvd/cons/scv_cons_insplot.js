/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  2 Mar 2025          Huy Pham			    Init, create file, Chức năng tính toán Số lượng lỗi lật tấm, from mr.NĐHuy(https://app.clickup.com/t/86cy51faq)
 */
define(['N/search',
    '../cons/scv_cons_format.js',
    '../cons/scv_cons_search.js',
    '../cons/scv_cons_search_error_qty.js'
],
    function(search,
        constFormat,
        constSearch,
        constSearchErrorQty
    ) {
        const TYPE = "customrecord_scv_insp_lot";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            DETAIL_SHIFT:{
                ID: "recmachcustrecord_scv_ds_inslot",
                TYPE : "customrecord_scv_detail_shift",
            }
        }
    
        const RECORDS = {
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customrecord_scv_insp_lot",
                filters:
                [
                    ["isinactive","is","F"]
                ],
                columns:
                [
                    "internalid",
                    "name"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid",
                    "name"
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

        /**
         * header: custrecord_scv_inspl_kcs_receipt_date
         */
        const calcErrorOfWorkShift = (_curRec) =>{
            let sublistId = SUBLIST.DETAIL_SHIFT.ID;
            let sizeSublist = _curRec.getLineCount(sublistId);
            if(sizeSublist === 0) return;
            
            let inspectDate = _curRec.getValue("custrecord_scv_inspl_kcs_receipt_date");
            inspectDate = !!inspectDate ? constFormat.formatDate(inspectDate) : "";

            let arrLineDetail = [];

            for(let i = 0; i < sizeSublist; i++){
                _curRec.selectLine(sublistId, i);

                let objLine = {
                    line: i,
                    custrecord_scv_ds_to: _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_to"),
                    custrecord_scv_ds_error_des: _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_error_des"),
                    custrecord_scv_ds_date: _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_date"),
                    custrecord_scv_ds_error: _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_error") * 1,
                    custrecord_scv_ds_single_error: _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_single_error") * 1,
                    custrecord_scv_ds_multi_error: _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_multi_error") * 1,
                }
                objLine.custrecord_scv_ds_date = !!objLine.custrecord_scv_ds_date ? constFormat.formatDate(objLine.custrecord_scv_ds_date) : "";

                if(!!objLine.custrecord_scv_ds_to){
                    objLine.custrecord_scv_ds_to = objLine.custrecord_scv_ds_to.toString().split("\x05").toString();
                }

                arrLineDetail.push(objLine);
            }

            let arrDataErrorQty = getDataErrorQty(_curRec, {
                custrecord_scv_ds_date: inspectDate,
                custrecord_scv_ds_to: arrLineDetail.map(e => e.custrecord_scv_ds_to).join(","),
                custrecord_scv_ds_error_des: arrLineDetail.map(e => e.custrecord_scv_ds_error_des),
            });

            for(let i = 0; i < arrLineDetail.length; i++){
                let objLine = arrLineDetail[i];

                let new_single_error = 0;

                let objDataErrorQty = arrDataErrorQty.find(e => e.custrecord_scv_ds_date == inspectDate
                    && e.custrecord_scv_ds_to === objLine.custrecord_scv_ds_to 
                    && e.custrecord_scv_ds_error_des === objLine.custrecord_scv_ds_error_des
                );
                if(!!objDataErrorQty){
                    new_single_error = 1;
                }

                let new_multi_error = objLine.custrecord_scv_ds_error - new_single_error;

                if(objLine.custrecord_scv_ds_single_error == new_single_error
                    && objLine.custrecord_scv_ds_multi_error == new_multi_error
                ){
                    continue;
                }

                _curRec.selectLine(sublistId, objLine.line);

                _curRec.setCurrentSublistValue({
                    sublistId: sublistId, fieldId: "custrecord_scv_ds_single_error", 
                    value: new_single_error, ignoreFieldChange: true
                });
                _curRec.setCurrentSublistValue({
                    sublistId: sublistId, fieldId: "custrecord_scv_ds_multi_error", 
                    value: new_multi_error, ignoreFieldChange: true
                });

                _curRec.commitLine(sublistId);
            }
        }

        /**
         * line: custrecord_scv_ds_date custrecord_scv_ds_to custrecord_scv_ds_error_des
         */
        const calcCurrentSublistValueDetailShift_SingleError = (_curRec) =>{
            let sublistId = SUBLIST.DETAIL_SHIFT.ID;
            
            let inspectDate = _curRec.getValue("custrecord_scv_inspl_kcs_receipt_date");
            inspectDate = !!inspectDate ? constFormat.formatDate(inspectDate) : "";

            let custrecord_scv_ds_to = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_to");
            if(!!custrecord_scv_ds_to){
                custrecord_scv_ds_to = custrecord_scv_ds_to.toString().split("\x05").toString();
            }
            let custrecord_scv_ds_error_des = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_error_des");
            if(!inspectDate || !custrecord_scv_ds_to || !custrecord_scv_ds_error_des) return;
            
            let arrDataErrorQty = getDataErrorQty(_curRec, {
                custrecord_scv_ds_date: inspectDate,
                custrecord_scv_ds_to: custrecord_scv_ds_to,
                custrecord_scv_ds_error_des: custrecord_scv_ds_error_des
            });
            
            let ttl_single_error = 0;
            arrDataErrorQty.forEach(obj => {
                ttl_single_error += obj.custrecord_scv_ds_single_error * 1;
            })

            let new_single_error = ttl_single_error == 0 ? 1 : 0;
            _curRec.setCurrentSublistValue({
                sublistId: sublistId, fieldId: "custrecord_scv_ds_single_error", value: new_single_error
            });

            return new_single_error;
        }

        //line: custrecord_scv_ds_error custrecord_scv_ds_single_error
        const calcCurrentSublistValueDetailShift_MultiError = (_curRec) =>{
            let sublistId = SUBLIST.DETAIL_SHIFT.ID;
            
            let count_error = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_error") * 1;
            let single_error = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_single_error") * 1;
            let old_multi_error = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_ds_multi_error") * 1;
            
            let new_multi_error = count_error - single_error;

            if(new_multi_error == old_multi_error) return old_multi_error;

            _curRec.setCurrentSublistValue({
                sublistId: sublistId, fieldId: "custrecord_scv_ds_multi_error", value: new_multi_error
            });

            return new_multi_error;
        }

        const getDataErrorQty = (_curRec, _params) =>{
            let myFilters = [];

            if(!!_params.custrecord_scv_ds_date){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_inspl_kcs_receipt_date', 
                    join: 'CUSTRECORD_SCV_DS_INSLOT', 
                    operator: "on", 
                    values: _params.custrecord_scv_ds_date
                }))
            }
            if(!!_params?.custrecord_scv_ds_error_des?.toString()){
                myFilters.push(search.createFilter({
                    name: 'custrecord_scv_ds_error_des', 
                    operator: "anyof", 
                    values: _params.custrecord_scv_ds_error_des.toString().split(",")
                }))
            }

            let arrErrorQty = constSearchErrorQty.getDataSource(myFilters);
            
            if(!!_params?.custrecord_scv_ds_to?.toString()){
                arrErrorQty = arrErrorQty.filter(e => e.custrecord_scv_ds_to == _params.custrecord_scv_ds_to);
                // myFilters.push(search.createFilter({
                //     name: 'custrecord_scv_ds_to', 
                //     operator: "anyof", 
                //     values: _params.custrecord_scv_ds_to.toString().split(",")
                // }))
            }

            return arrErrorQty;
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            calcErrorOfWorkShift,
            calcCurrentSublistValueDetailShift_SingleError,
            calcCurrentSublistValueDetailShift_MultiError
        };
        
    });
    