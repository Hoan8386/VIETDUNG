/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  25 Apr 2025		    Khanh Tran			    Init, create file. Phát triển tính các giá trị trên PO (Purchase order) from Ms.Kỳ(https://app.clickup.com/t/86cyknytj)
 */
define(['N/search', 'N/runtime', 'N/record',
    '../cons/scv_cons_record.js',
],
    function(search, runtime, record,
        constRecord
    ) {
        const TYPE = "purchaseorder";
        const FIELD = {
            ID: "id",
            INACTIVE: "isinactive",
            NAME: "name"
        }
    
        const RECORDS = {

        }

        const SUBLIST = {
            ITEM: {
                ID: "item",
                TYPE : "transactionline",
                FIELD: {}
            },
        }

        const updateRecordBody = (curRec) => {
            let sublistId = SUBLIST.ITEM.ID;
            let objTtl = constRecord.getTotalOfFieldsSublist(curRec, sublistId, ['custcol_scv_amount_bef_tolerance', 'custcol_scv_gross_amt_bef_tolerance']);
            setDataNumber(curRec, 'custbody_scv_amount_bef_tolerance', objTtl.custcol_scv_amount_bef_tolerance);
            setDataNumber(curRec, 'custbody_scv_total_amt_bef_tolerance', objTtl.custcol_scv_gross_amt_bef_tolerance);
        }

        const updateRecordLineItems = (curRec) => {
            let sublistId = SUBLIST.ITEM.ID;
            for(let i = 0; i < curRec.getLineCount(sublistId); i++) {
                calcLine_ThanhTienTruocDungSai(curRec, sublistId, i);
                calcLine_TienThueTruocDungSai(curRec, sublistId, i);
                calcLine_TongTienSauThueTruocDungSai(curRec, sublistId, i);
                calcLine_SoLuongTheoDVT(curRec, sublistId, i);
                calcLine_ThanhTienTheoDVT(curRec, sublistId, i);
                calcLine_Rate(curRec, sublistId, i);
            }
        }

        const calcLine_Rate = (curRec, sublistId, line) => {
            let converted_amount = getData(curRec, 'custcol_scv_po_converted_amount', sublistId, line);
            let qty_before_tolerance = getData(curRec, 'custcol_scv_qty_before_tolerance', sublistId, line);
            if(converted_amount === '' || qty_before_tolerance === '' || !qty_before_tolerance) return;
            setDataNumber(curRec, 'rate', converted_amount / qty_before_tolerance, sublistId, line);
        }    
    
        const calcLine_ThanhTienTheoDVT = (curRec, sublistId, line) => {
            let qty_unit_m2 = getData(curRec, 'custcol_scv_po_qty_unit_m2', sublistId, line);
            let converted_unit_price = getData(curRec, 'custcol_scv_po_converted_unit_price', sublistId, line);
            if(qty_unit_m2 === '' || converted_unit_price === '') return;
            setDataNumber(curRec, 'custcol_scv_po_converted_amount', qty_unit_m2 * converted_unit_price, sublistId, line);
        }
    
        const calcLine_SoLuongTheoDVT = (curRec, sublistId, line) => {
            let qty_before_tolerance = getData(curRec, 'custcol_scv_qty_before_tolerance', sublistId, line);
            let unit_conversion_rate = getData(curRec, 'custcol_scv_po_unit_conversion_rate', sublistId, line);
            if(qty_before_tolerance === '' || unit_conversion_rate === '' || !unit_conversion_rate) return;
            setDataNumber(curRec, 'custcol_scv_po_qty_unit_m2', qty_before_tolerance / unit_conversion_rate, sublistId, line);
        }
    
        const calcLine_TongTienSauThueTruocDungSai = (curRec, sublistId, line) => {
            let amt_tax_bef_tolerance = getData(curRec, 'custcol_scv_amt_tax_bef_tolerance', sublistId, line) * 1;
            let amount_bef_tolerance = getData(curRec, 'custcol_scv_amount_bef_tolerance', sublistId, line) * 1;
            setDataNumber(curRec, 'custcol_scv_gross_amt_bef_tolerance', amt_tax_bef_tolerance + amount_bef_tolerance, sublistId, line);
        }
    
        const calcLine_TienThueTruocDungSai = (curRec, sublistId, line) => {debugger
            let amount_bef_tolerance = getData(curRec, 'custcol_scv_amount_bef_tolerance', sublistId, line) * 1;
            let taxrate1 = getData(curRec, 'taxrate1', sublistId, line) * 1;
            setDataNumber(curRec, 'custcol_scv_amt_tax_bef_tolerance', amount_bef_tolerance * taxrate1/100, sublistId, line);
        }
    
        const calcLine_ThanhTienTruocDungSai = (curRec, sublistId, line) => {
            let qty_before_tolerance = getData(curRec, 'custcol_scv_qty_before_tolerance', sublistId, line) * 1;
            let rate = getData(curRec, 'rate', sublistId, line) * 1;
            setDataNumber(curRec, 'custcol_scv_amount_bef_tolerance', qty_before_tolerance * rate, sublistId, line);
        }

        const setDataNumber = (curRec, fieldId, value, sublistId, line) => {
            if(typeof value !== 'number' || Number.isNaN(value)) return;
            value = roundData(curRec, fieldId, value);
            if(sublistId){
                curRec.setSublistValue({sublistId: sublistId, fieldId: fieldId, line: line, value: value});
            }
            else curRec.setValue(fieldId, value);
        }
        
        const roundData = (curRec, fieldId, value) => {
            if([
                'custcol_scv_po_converted_amount', 'custcol_scv_gross_amt_bef_tolerance', 'custcol_scv_amt_tax_bef_tolerance', 
                'custcol_scv_amount_bef_tolerance', 'custbody_scv_amount_bef_tolerance', 'custbody_scv_total_amt_bef_tolerance'
            ].includes(fieldId)){
                if(curRec.getValue('currency') == 1) value = Math.round(value);
                else value = value.toFixed(2); 
                return value;
            }else if(['custcol_scv_po_qty_unit_m2'].includes(fieldId)){
                return value.toFixed(2); 
            }
            
            return value;
        }

        const getData = (curRec, fieldId, sublistId, line) => {
            let value;
            if (sublistId) {
                value = curRec.getSublistValue({ sublistId: sublistId, fieldId: fieldId, line: line});
            } else {
                value = curRec.getValue({ fieldId });
            }
            
            return value;
        }

        return {
            TYPE,
            FIELD,
            RECORDS,
            updateRecordBody,
            roundData,
            updateRecordLineItems
        };
        
    });
    