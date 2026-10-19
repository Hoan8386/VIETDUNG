/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  03 June 2025		Khanh Tran			    Init, create file.
 *  03 June 2025        Khanh Tran              Tính các giá trị trên SO (theo dung sai), from ms.Ngọc(https://app.clickup.com/t/86cz4f1c2)
 *  05 June 2025        Khanh Tran              Phát triển tính các giá trị trên PO, ITR, IB from Ms.Kỳ, Mr.Hải, Mr.Phúc(https://app.clickup.com/t/86cyknytj)
 * 
 */
define(['N/url', 'N/runtime',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_record.js',
    '../cons/scv_cons_currency.js',
    '../cons/scv_cons_department.js',
    '../cons/scv_cons_role.js',
],function(url, runtime,
    lbf,
    constRecord,
    constCurrency,
    constDepartment,
    constRole
) {
    
    const setTotalOfFieldsSublist = (curRec) => {
        if(curRec.type == "salesorder" && curRec.getValue("customform")*1 != 106) return;
        
        let objTtl = constRecord.getTotalOfFieldsSublist(curRec, 'item', ['custcol_scv_amount_bef_tolerance', 'custcol_scv_gross_amt_bef_tolerance']);
        setDataNumber(curRec, 'custbody_scv_amount_bef_tolerance', objTtl.custcol_scv_amount_bef_tolerance);
        setDataNumber(curRec, 'custbody_scv_total_amt_bef_tolerance', objTtl.custcol_scv_gross_amt_bef_tolerance);
    }

    const updateRecordWithTolerance = (curRec) => {
        let sublistId = "item";
        let lcItem = curRec.getLineCount(sublistId);
        if(curRec.type === "salesorder") {
            for(let i = 0; i < lcItem; i++) {
                calcLine_SoLuongSauDungSai(curRec, sublistId, i);
                calcLine_ThanhTienTruocDungSai(curRec, sublistId, i);
                calcLine_TienThueTruocDungSaiV2(curRec, sublistId, i);
                calcLine_TongTienTruocDungSai(curRec, sublistId, i);
            }
        
            setTotalOfFieldsSublist(curRec);
        } 
        else if(curRec.type === "purchaseorder") {
            for(let i = 0; i < lcItem; i++) {
                calcLine_ThanhTienTruocDungSai(curRec, sublistId, i);
                calcLine_TienThueTruocDungSaiV2(curRec, sublistId, i);
                calcLine_TongTienTruocDungSai(curRec, sublistId, i);
                calcLine_SoLuongTheoDVT(curRec, sublistId, i);
                calcLine_ThanhTienTheoDVT(curRec, sublistId, i);
                calcLine_Rate(curRec, sublistId, i);
            }
        
            setTotalOfFieldsSublist(curRec);
        }
        else if(curRec.type === "itemreceipt") {
            for(let i = 0; i < lcItem; i++) {
                // calcLine_SoLuongTheoDVT(curRec, sublistId, i);
                calcLine_ThanhTienTheoDVT(curRec, sublistId, i);
                calcLine_Rate(curRec, sublistId, i);
            }
        }
    }

    const handleFiedTolerance = (curRec, fieldId) => {
        let roleInternalId = runtime.getCurrentUser().role;
        let sublistId = "item";
        if(curRec.type == "salesorder"){
            if(curRec.getValue("customform")*1 != 106) return;//NVD Xuất khẩu

            if(fieldId == 'custcol_scv_qty_before_tolerance' || fieldId == 'custcol_scv_po_positive_tolerance'){
                calcLine_SoLuongSauDungSai(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_qty_before_tolerance' || fieldId == 'rate'){
                calcLine_ThanhTienTruocDungSai(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_amount_bef_tolerance' || fieldId == 'taxrate1'){
                calcLine_TienThueTruocDungSaiV2(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_amt_tax_bef_tolerance' || fieldId == 'custcol_scv_amount_bef_tolerance'){
                calcLine_TongTienTruocDungSai(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_gross_amt_bef_tolerance'){
                calc_TongTienTruocDungSai(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_gross_amt_bef_tolerance'){
                calc_ThanhTienTruocDungSai(curRec, sublistId);
            }
        }
        else if(curRec.type == "purchaseorder"){
            if(fieldId == 'custcol_scv_qty_before_tolerance' || fieldId == 'rate'){
                calcLine_ThanhTienTruocDungSai(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_amount_bef_tolerance' || fieldId == 'taxrate1'){
                calcLine_TienThueTruocDungSaiV2(curRec, sublistId);
                calc_ThanhTienTruocDungSai(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_amt_tax_bef_tolerance' || fieldId == 'custcol_scv_amount_bef_tolerance'){
                calcLine_TongTienTruocDungSai(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_qty_before_tolerance' || fieldId == 'custcol_scv_po_unit_conversion_rate'){
                calcLine_SoLuongTheoDVT(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_po_qty_unit_m2' || fieldId == 'custcol_scv_po_converted_unit_price'){
                calcLine_ThanhTienTheoDVT(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_po_converted_amount' || fieldId == 'custcol_scv_qty_before_tolerance'){
                calcLine_Rate(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_gross_amt_bef_tolerance'){
                calc_TongTienTruocDungSai(curRec, sublistId);
            }
        }
        else if(curRec.type == "itemreceipt"){
            if(fieldId == 'quantity' || fieldId == 'custcol_scv_po_unit_conversion_rate'){
                // calcLine_SoLuongTheoDVT(curRec, sublistId);
            } else if(fieldId == 'custcol_scv_po_qty_unit_m2' || fieldId == 'custcol_scv_po_converted_unit_price'){
                calcLine_ThanhTienTheoDVT(curRec, sublistId);

                if (roleInternalId == constRole.RECORDS.NVD_BP_KHO_VAN.ID) {
                    calcLine_Rate(curRec, sublistId);
                }
            } else if(fieldId == 'custcol_scv_po_converted_amount' || fieldId == 'quantity'){
                calcLine_Rate(curRec, sublistId);
            }
        }
        else if(curRec.type == "inboundShipment"){
            sublistId = "items";
            if(fieldId == 'custrecord_scv_po_qty_unit_m2' || fieldId == 'custrecord_scv_po_converted_unit_price'){
                calcLine_ThanhTienTheoDVT(curRec, sublistId);
            } else if(fieldId == 'custrecord_scv_po_converted_amount' || fieldId == 'quantityexpected'){
                //calcLine_ExpectedRate(curRec, sublistId);
            }
        }
    }

    const calc_TongTienTruocDungSai = (curRec, sublistId) => {
        let tongTienTruocDungSai = constRecord.getTotalOfFieldsSublist(curRec, sublistId, ['custcol_scv_gross_amt_bef_tolerance']);
        setDataNumber(curRec, 'custbody_scv_total_amt_bef_tolerance', tongTienTruocDungSai);
    }

    const calc_ThanhTienTruocDungSai = (curRec, sublistId) => {
        let thanhTienTruocDungSai = constRecord.getTotalOfFieldsSublist(curRec, sublistId, ['custcol_scv_amount_bef_tolerance']);
        setDataNumber(curRec, 'custbody_scv_amount_bef_tolerance', thanhTienTruocDungSai);
    }

    const calcLine_ExpectedRate = (curRec, sublistId, line) => {
        let converted_amount = getDataSublistField(curRec, sublistId, 'custrecord_scv_po_converted_amount', line) * 1;
        let quantityexpected = getDataSublistField(curRec, sublistId, 'quantityexpected', line) * 1;
        if(converted_amount && quantityexpected){
            setDataNumber(curRec, 'expectedrate', converted_amount / quantityexpected, sublistId, line);
        }
    }

    const calcLine_Rate = (curRec, sublistId, line) => {
        let field_qty = 'custcol_scv_qty_before_tolerance';
        if(curRec.type === "itemreceipt"){
            field_qty = 'quantity';
        }

        let qty_before_tolerance = getDataSublistField(curRec, sublistId, field_qty, line) * 1;
        let converted_amount = getDataSublistField(curRec, sublistId, 'custcol_scv_po_converted_amount', line) * 1;
        if(converted_amount && qty_before_tolerance){
            setDataNumber(curRec, 'rate', converted_amount / qty_before_tolerance, sublistId, line);
        }
    }

    const calcLine_ThanhTienTheoDVT = (curRec, sublistId, line) => {
        let field_qty_unit_m2 = 'custcol_scv_po_qty_unit_m2';
        let field_converted_unit_price = 'custcol_scv_po_converted_unit_price';
        let field_converted_amount = 'custcol_scv_po_converted_amount';
        if(curRec.type === "inboundShipment"){
            field_qty_unit_m2 = 'custrecord_scv_po_qty_unit_m2';
            field_converted_unit_price = 'custrecord_scv_po_converted_unit_price';
            field_converted_amount = 'custrecord_scv_po_converted_amount';
        }

        let qty_unit_m2 = getDataSublistField(curRec, sublistId, field_qty_unit_m2, line) * 1;
        let converted_unit_price = getDataSublistField(curRec, sublistId, field_converted_unit_price, line) * 1;
        if(qty_unit_m2 && converted_unit_price){
            setDataNumber(curRec, field_converted_amount, qty_unit_m2 * converted_unit_price, sublistId, line);
        }
    }

    const calcLine_SoLuongTheoDVT = (curRec, sublistId, line) => {
        let unit_conversion_rate = getDataSublistField(curRec, sublistId, 'custcol_scv_po_unit_conversion_rate', line) * 1;
        let field_qty = 'custcol_scv_qty_before_tolerance';
        if(curRec.type === "itemreceipt"){
            field_qty = 'quantity';
        }

        let qty_before_tolerance = getDataSublistField(curRec, sublistId, field_qty, line) * 1;
        if(qty_before_tolerance && unit_conversion_rate){
            setDataNumber(curRec, 'custcol_scv_po_qty_unit_m2', qty_before_tolerance / unit_conversion_rate, sublistId, line);
        }
    }
    
    const calcLine_TongTienTruocDungSai = (curRec, sublistId, line) => {
        let amt_tax_bef_tolerance = getDataSublistField(curRec, sublistId, 'custcol_scv_amt_tax_bef_tolerance', line) * 1;
        let amount_bef_tolerance = getDataSublistField(curRec, sublistId, 'custcol_scv_amount_bef_tolerance', line) * 1;
        setDataNumber(curRec, 'custcol_scv_gross_amt_bef_tolerance', amt_tax_bef_tolerance + amount_bef_tolerance, sublistId, line);
    }

    const calcLine_TienThueTruocDungSai = (curRec, sublistId, line) => {
        let amount_bef_tolerance = getDataSublistField(curRec, sublistId, 'custcol_scv_amount_bef_tolerance', line) * 1;
        let taxrate1 = getDataSublistField(curRec, sublistId, 'taxrate1', line) * 1;
        if(amount_bef_tolerance){
            setDataNumber(curRec, 'custcol_scv_amt_tax_bef_tolerance', amount_bef_tolerance * taxrate1/100, sublistId, line);
        }
    }

    const calcLine_TienThueTruocDungSaiV2 = (curRec, sublistId, line) => {
        let qty_before_tolerance = getDataSublistField(curRec, sublistId, 'custcol_scv_qty_before_tolerance', line) * 1;
        let rate = getDataSublistField(curRec, sublistId, 'rate', line) * 1;
        let amount_bef_tolerance = roundData(curRec, 'custcol_scv_amount_bef_tolerance', qty_before_tolerance * rate);
        let cur_amount_bef_tolerance = getDataSublistField(curRec, sublistId, 'custcol_scv_amount_bef_tolerance', line) * 1;
         
        let final_amount = amount_bef_tolerance === cur_amount_bef_tolerance ? qty_before_tolerance * rate : cur_amount_bef_tolerance;
        let taxrate1 = getDataSublistField(curRec, sublistId, 'taxrate1', line) * 1;

        setDataNumber(curRec, 'custcol_scv_amt_tax_bef_tolerance', final_amount * taxrate1/100, sublistId, line);
    }

    const calcLine_ThanhTienTruocDungSai = (curRec, sublistId, line) => {
        let qty_before_tolerance = getDataSublistField(curRec, sublistId, 'custcol_scv_qty_before_tolerance', line) * 1;
        let rate = getDataSublistField(curRec, sublistId, 'rate', line) * 1;
        if(qty_before_tolerance && rate){
            setDataNumber(curRec, 'custcol_scv_amount_bef_tolerance', qty_before_tolerance * rate, sublistId, line);
        }
    }

    const calcLine_SoLuongSauDungSai = (curRec, sublistId, line) => {
        let qty_before_tolerance = getDataSublistField(curRec, sublistId, 'custcol_scv_qty_before_tolerance', line) * 1;
        let positive_tolerance = getDataSublistField(curRec, sublistId, 'custcol_scv_po_positive_tolerance', line) * 1;
        if(qty_before_tolerance){
            setDataNumber(curRec, 'quantity', qty_before_tolerance * (1 + positive_tolerance/100), sublistId, line);
        }
    }

    const setDataNumber = (curRec, fieldId, value, sublistId, line) => {
        if(typeof value !== 'number' || Number.isNaN(value)) return;

        value = roundData(curRec, fieldId, value);

        if(sublistId){
            if(line === 0 || line) curRec.setSublistValue({sublistId: sublistId, fieldId: fieldId, value: value, line: line});
            else curRec.setCurrentSublistValue({sublistId: sublistId, fieldId: fieldId, value: value});
        }
        else curRec.setValue(fieldId, value);
    }

    const roundData = (curRec, fieldId, value) => {
        let currency = curRec.getValue('currency');
        if(curRec.type === "salesorder"){
            if([
                'custcol_scv_gross_amt_bef_tolerance', 'custcol_scv_amt_tax_bef_tolerance', 'custcol_scv_amount_bef_tolerance', 
                'custbody_scv_amount_bef_tolerance', 'custbody_scv_total_amt_bef_tolerance'
            ].includes(fieldId)){
                if(currency != constCurrency.RECORDS.VND.ID) value = Math.round((value) * 100) / 100;
            }
        }
        else if(curRec.type === "purchaseorder" || curRec.type === "itemreceipt"){
            if([
                'custcol_scv_po_converted_amount', 'custcol_scv_gross_amt_bef_tolerance', 'custcol_scv_amt_tax_bef_tolerance', 
                'custcol_scv_amount_bef_tolerance', 'custbody_scv_amount_bef_tolerance', 'custbody_scv_total_amt_bef_tolerance'
            ].includes(fieldId)){
                if(currency == constCurrency.RECORDS.VND.ID) value = Math.round(value);
                else value = Math.round((value) * 100) / 100; 
            }
            
            if(fieldId == "custcol_scv_po_qty_unit_m2" && curRec.type === "purchaseorder"){
                if(currency == constCurrency.RECORDS.USD.ID) value = Math.round(value);
                else if(currency == constCurrency.RECORDS.VND.ID) value = Math.round((value) * 100) / 100; 
            }
        }

        return value;
    }

    const getDataSublistField = (curRec, sublistId, fieldId, line) => {
        if(line === 0 || line) return curRec.getSublistValue({sublistId: sublistId, fieldId: fieldId, line: line});
        else return curRec.getCurrentSublistValue({sublistId: sublistId, fieldId: fieldId});
    }

    const addBtnCalcRate = (form, curRec) => {
        let curUser = runtime.getCurrentUser();
        if(![
            constDepartment.RECORDS.PHONG_KE_TOAN.ID, 
            constDepartment.RECORDS.PHONG_VAT_TU.ID, 
            constDepartment.RECORDS.PHONG_XNK.ID, 
        ].includes(curUser.department * 1)) return;

        let createdfrom = curRec.getValue('createdfrom');
        if(!createdfrom || lbf.getTranRecordType(createdfrom) !== 'purchaseorder') return;

        let urlService = url.resolveScript({
			scriptId: 'customscript_scv_sl_tolerance_values',
			deploymentId: 'customdeploy_scv_sl_tolerance_values',
			params: { rectype: curRec.type, recid: curRec.id, action: 'calc_rate_itr' }
		});

        form.addButton({
            id: 'custpage_scv_btn_calc_rate',
            label: 'Tính đơn giá',
            functionName: `window.location.replace('${urlService}')`
        });
        
    }

    return {
        setTotalOfFieldsSublist,
        handleFiedTolerance,
        updateRecordWithTolerance,
        addBtnCalcRate,
        calcLine_ExpectedRate
        
    };
    
});
    