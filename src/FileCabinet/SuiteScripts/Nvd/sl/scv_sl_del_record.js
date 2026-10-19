/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['../lib/scv_lib_function', 'N/record', '../olib/alasql/alasql.min@1.7.3', 'N/search', 'N/redirect'], function (lfn, record, alasql, search, redirect) {
    const CustomConfigData = {
        TYPE_LINE: {
            FIELD: 1,
            SUBLIST: 2
        },
        RECORD_TYPE_FIELD: {
            TRANSACTION: '1',
            OTHERS: '2',
            ITEM: '3'
        },
        FIELD_TYPE: {
            SELECT: 'select',
            MULTISELECT: 'multiselect'
        }
    };

    const onRequest = (ctx) => {
        let request = ctx.request;
        let params = request.parameters;
        let rectype = params.rectype;
        let recid = params.recid;
        let curRec = record.load({type: rectype, id: recid, isDynamic: true});
        let dataDeleteRecord = getDataConfigDeleteOfRecord(rectype);
        const arrSublist = alasql(`SELECT sublist_id, sublist_type, line_type
                                   FROM ?
                                   WHERE line_type = ?
                                   GROUP BY sublist_id, sublist_type, line_type `, [dataDeleteRecord, CustomConfigData.TYPE_LINE.SUBLIST]);
        const arrField = alasql(`SELECT fld, fld_rectype, fld_type, line_type
                                 FROM ?
                                 WHERE line_type = ?
                                 GROUP BY fld, fld_rectype, fld_type, line_type`, [dataDeleteRecord, CustomConfigData.TYPE_LINE.FIELD]);
        const objDataSublistDel = getDataRecordAttachWithSublist(curRec, arrSublist);
        const objDataFieldDel = getDataRecordFieldDelete(curRec, arrField);
        deleteRecords(objDataSublistDel);
        deleteRecords(objDataFieldDel);
        record.delete({
            type: rectype,
            id: recid
        });
        throw 'Đã xóa thành công phiếu!';
    };

    const deleteRecords = (objData) => {
        const recordtypes = Object.keys(objData);
        const sz = recordtypes.length;
        for (let i = 0; i < sz; i++) {
            const recordtype = recordtypes[i];
            objData[recordtype].forEach(id => {
                record.delete({
                    type: recordtype,
                    id: id
                })
            });
        }
    }

    const getDataRecordFieldDelete = (curRec, arrField) => {
        const szFields = arrField.length;
        let objRes = {};
        let arrTransId = [];
        for (let i = 0; i < szFields; i++) {
            const fieldId = arrField[i].fld;
            const valFld = curRec.getValue(fieldId);
            const objFields = curRec.getField(fieldId);
            const isSelect = objFields.type === CustomConfigData.FIELD_TYPE.SELECT;
            const isMultiSelect = objFields.type === CustomConfigData.FIELD_TYPE.MULTISELECT;
            if (!isSelect && !isMultiSelect) {
                continue;
            }
            if (!lfn.isContainValue(valFld)) {
                continue;
            }
            let temp;
            const fieldType = arrField[i].fld_type;
            const recordtype = arrField[i].fld_rectype;
            if (fieldType === CustomConfigData.RECORD_TYPE_FIELD.TRANSACTION) {
                if (!Array.isArray(valFld)) temp = [valFld];
                arrTransId = arrTransId.concat(temp);
            } else if (fieldType === CustomConfigData.RECORD_TYPE_FIELD.OTHERS) {
                if (objRes[recordtype] === undefined) objRes[recordtype] = [];
                if (!Array.isArray(valFld)) temp = [valFld];
                objRes[recordtype] = objRes[recordtype].concat(temp);
            }
        }
        const objResTran = getDataInfoTransaction(arrTransId);
        return {
            ...objRes,
            ...objResTran
        };
    };

    const getDataInfoTransaction = (arrTransId) => {
        let objRes = {};
        const numTransId = arrTransId.length;
        if (numTransId === 0) return objRes;
        if (numTransId < 5) {
            for (let i = 0; i < numTransId; i++) {
                const idTran = arrTransId[i];
                const trantype = lfn.getTranRecordType(idTran);
                if (objRes[trantype] === undefined) objRes[trantype] = [];
                objRes[trantype].push(idTran);
            }
        } else {
            objRes = getObjRecordTypeTrans(arrTransId);
        }
        return objRes;
    }

    const getObjRecordTypeTrans = (arrTranId) => {
        let searchObj = search.create({
            type: 'transaction',
            filters: [
                search.createFilter({
                    name: 'internalid',
                    operator: 'anyof',
                    values: arrTranId
                }),
                search.createFilter({
                    name: 'mainline',
                    operator: 'is',
                    values: true
                })
            ],
            columns: ['recordtype']
        });
        let searchData = searchObj.run().getRange(0, 1000);
        let result = {};
        let sz = searchData.length;
        for (let i = 0; i < sz; i++) {
            const recordtype = searchData[i].getValue('recordtype');
            if (!result.hasOwnProperty(recordtype)) result[recordtype] = [];
            result[recordtype].push(searchData[i].id);
        }
        return result;
    }

    const getDataRecordAttachWithSublist = (curRec, arrDataSublist) => {
        const szSublists = arrDataSublist.length;
        let objRes = {};
        for (let i = 0; i < szSublists; i++) {
            const sublistId = arrDataSublist[i].sublist_id;
            const sublistRecordType = arrDataSublist[i].sublist_type;
            const lcSL = curRec.getLineCount({sublistId: sublistId});
            let arrId = [];
            for (let j = 0; j < lcSL; j++) {
                curRec.selectLine(sublistId, j);
                const id = curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: 'id'});
                arrId.push(id);
            }
            objRes[sublistRecordType] = arrId;
        }
        return objRes;
    };

    const getDataConfigDeleteOfRecord = (recordType) => {
        let sqlLoaDataConfig = `SELECT p.custrecord_scv_data_cf_rec_del_rectype   as recordtype,
                                       c.custrecord_scv_data_cf_rec_del_det_slid  as sublist_id,
                                       c.custrecord_scv_data_cf_rec_del_det_slty  as sublist_type,
                                       c.custrecord_scv_data_cf_rec_del_det_tcf   as line_type,
                                       c.custrecord_scv_data_cf_rec_del_det_rtype as fld_type,
                                       c.custrecord_scv_data_cf_rec_del_det_fld   as fld,
                                       c.custrecord_scv_data_cf_rec_del_det_typef as fld_rectype
                                FROM customrecord_scv_data_cf_rec_del AS p
                                         LEFT JOIN customrecord_scv_data_cf_rec_del_detail as c
                                                   ON p.id = c.custrecord_scv_data_cf_rec_del_parent
                                WHERE p.custrecord_scv_data_cf_rec_del_rectype = ?`;
        let result = lfn.callQuery(sqlLoaDataConfig, [recordType]);
        if (!result.isSuccess) {
            throw 'Error Config Delete Record! Please reconfig record SCV DATA CONFIG DELETE RECORD!'
        }
        return result.response;
    }

    return {
        onRequest
    }
})
;