/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  01 Mar 2025         Huy Pham			    Init, create file, Tính toán các field của Hiệu chuẩn TBĐ, from mr.Phong(https://app.clickup.com/t/86cy4w0z5)
 *  12 Sep 2025         Huy Pham			    Cập nhật trạng thái thiết bị đo {custrecord_scv_tbd_status}, from ms.Tâm(https://app.clickup.com/t/86cy4w0z5?comment=90160133683394)
 */
define(['N/record',
    '../cons/scv_cons_search.js',

    '../cons/scv_cons_cmms_status.js'
],
    function(record,
        constSearch,

        constCmmsStatus
    ) {
        const TYPE = "customrecord_scv_hieu_chinh_tb_do";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const SUBLIST = {
            DETAIL: {
                ID: "recmachcustrecord_scv_hctb_detail_parent",
                TYPE : "customrecord_scv_hctb_detail",
                FIELD: {}
            },
        }
    
        const RECORDS = {
        }

        const getDataSource = (_filters) => {
            let resultSearch =  constSearch.createSearchWithFilter({
                type: "customrecord_scv_hieu_chinh_tb_do",
                filters:
                [
                    
                ],
                columns:
                [
                    "internalid", "name"
                ]
            }, _filters);
            
            let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
                let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
                    "internalid", "name"
                ]);

                return objResTmpl;
            });
            
            return arrResult;
        }

        const calcCurrentSublistValueDetail = (_curRec) =>{
            calcCurrentSublistValueDetail_Error01st(_curRec);
            calcCurrentSublistValueDetail_Error02nd(_curRec);
            calcCurrentSublistValueDetail_Error03rd(_curRec);
        }

        const calcCurrentSublistValueDetail_Error01st = (_curRec) =>{
            let sublistId = SUBLIST.DETAIL.ID;

            let custrecord_scv_hctb_targer = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_hctb_targer") * 1;
            let custrecord_scv_hctb_detail_kq_1st = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_hctb_detail_kq_1st");

            let custrecord_scv_hctb_detail_error_1st = custrecord_scv_hctb_targer - custrecord_scv_hctb_detail_kq_1st;
            
            _curRec.setCurrentSublistValue(sublistId, "custrecord_scv_hctb_detail_error_1st", custrecord_scv_hctb_detail_error_1st);

            return custrecord_scv_hctb_detail_error_1st;
        }

        const calcCurrentSublistValueDetail_Error02nd = (_curRec) =>{
            let sublistId = SUBLIST.DETAIL.ID;

            let custrecord_scv_hctb_targer = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_hctb_targer") * 1;
            let custrecord_scv_hctb_detail_kq_2nd = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_hctb_detail_kq_2nd");

            let custrecord_scv_hctb_error_2nd = custrecord_scv_hctb_targer - custrecord_scv_hctb_detail_kq_2nd;
            
            _curRec.setCurrentSublistValue(sublistId, "custrecord_scv_hctb_error_2nd", custrecord_scv_hctb_error_2nd);

            return custrecord_scv_hctb_error_2nd;
        }

        const calcCurrentSublistValueDetail_Error03rd = (_curRec) =>{
            let sublistId = SUBLIST.DETAIL.ID;

            let custrecord_scv_hctb_targer = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_hctb_targer") * 1;
            let custrecord_scv_hctb_kq_3rd = _curRec.getCurrentSublistValue(sublistId, "custrecord_scv_hctb_kq_3rd");

            let custrecord_scv_hctb_error_rd = custrecord_scv_hctb_targer - custrecord_scv_hctb_kq_3rd;
            
            _curRec.setCurrentSublistValue(sublistId, "custrecord_scv_hctb_error_rd", custrecord_scv_hctb_error_rd);

            return custrecord_scv_hctb_error_rd;
        }

        const updateInfoEquipment = (_curRec) =>{
            let statusId = _curRec.getValue("custrecord_scv_hctb_status");
            if(statusId != constCmmsStatus.RECORDS.APPROVED.ID) return;

            let sublistId = SUBLIST.DETAIL.ID;
            let sizeSublist = _curRec.getLineCount(sublistId);

            let arrEquipment = [];

            for(let i = 0; i < sizeSublist; i++){
                let equipmentId = _curRec.getSublistValue(sublistId, "custrecord_scv_hctb_detail_thiet_bi", i);
                if(!equipmentId) continue;
                
                let idxEquipmentExist = arrEquipment.findIndex(e => e.custrecord_scv_hctb_detail_thiet_bi == equipmentId);
                if(idxEquipmentExist > -1){
                    continue;
                }
                
                arrEquipment.push({
                    custrecord_scv_hctb_detail_thiet_bi: equipmentId,
                    custrecord_scv_hctb_nexttime: _curRec.getSublistValue(sublistId, "custrecord_scv_hctb_nexttime", i),
                    custrecord_scv_hctbd_detail_status_after: _curRec.getSublistValue(sublistId, "custrecord_scv_hctbd_detail_status_after", i),
                });
            }

            arrEquipment.forEach(objEquipment => {
                let objValuesUpdate = {
                    custrecord_scv_tbd_status: objEquipment.custrecord_scv_hctbd_detail_status_after,
                };

                if(!!objEquipment.custrecord_scv_hctb_nexttime){
                    objValuesUpdate.custrecord_scv_tbd_next_modify_date = objEquipment.custrecord_scv_hctb_nexttime;
                }

                record.submitFields({
                    type: "customrecord_scv_qly_thiet_bi_do",
                    id: objEquipment.custrecord_scv_hctb_detail_thiet_bi,
                    values: objValuesUpdate,
                    options: {
                        enableSourcing: false, ignoreMandatoryFields : true
                    }
                });
            });
        }

        return {
            TYPE,
            FIELD,
            SUBLIST,
            RECORDS,
            getDataSource,
            calcCurrentSublistValueDetail,
            calcCurrentSublistValueDetail_Error01st,
            calcCurrentSublistValueDetail_Error02nd,
            calcCurrentSublistValueDetail_Error03rd,
            updateInfoEquipment
        };
        
    });
    