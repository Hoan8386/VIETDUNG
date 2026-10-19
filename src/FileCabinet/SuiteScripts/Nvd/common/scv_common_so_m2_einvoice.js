/**
 * Nội dung:
 * Key:
 * * =======================================================================================
 *  Date                Author                  Description
 *  10 Sep 2026         Phu Pham	    		Init & create file, tính toán m2 einvoice amount trên màn hình SO from ms. Ngọc (https://app.clickup.com/t/3773072/14yhnhmfdgm)
 *  */
/**
 * @NApiVersion 2.1
 */
define([
    'N/record',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_format.js',
    '../cons/scv_cons_taxcode.js',
    '../cons/scv_cons_search_so_m2_einvoice_cal.js',
],
    (
        record,
        lbf,
        constFormat,
        constTaxCode,
        searchSOM2EinvoiceCal,
    ) => {

        const afterSubmit_CalcM2EinvoiceAmt = (curRec) => {
            let m2_invoice = curRec.getValue("custbody_scv_m2_invoice");
            if(!m2_invoice) return;

            let rectype = curRec.type;
            let soM2M_ID = curRec.id;
            if(rectype === 'itemfulfillment') {
                let createdfrom = curRec.getValue("createdfrom");
                let createdfromType = lbf.getTranRecordType(createdfrom);

                if(createdfromType !== "salesorder") return;
                soM2M_ID = createdfrom;
            }

            const arrResult = searchSOM2EinvoiceCal.getDataSource({internalid: soM2M_ID});
            if(arrResult.length > 0) {
                let m2_quatity = curRec.getValue("custbody_scv_m2_quatity") * 1;
                let m2_tax_code = curRec.getValue("custbody_scv_m2_tax_code");

                const objSalesOrd = arrResult[0];
                const objTaxCode = constTaxCode.getDataInfoTaxCodeById(m2_tax_code);

                let m2_tax_rate = objTaxCode?.rate || 0;
                let m2_gross_amt = objSalesOrd.amount_total * 1;  
                let m2_amount = m2_gross_amt / (1 + m2_tax_rate);
                let m2_unit_price = !!m2_quatity ? (m2_amount / m2_quatity) : 0;
                let m2_tax_amount = m2_gross_amt - m2_amount;

                const values = {
                    "custbody_scv_m2_gross_amt": m2_gross_amt,
                    "custbody_scv_m2_amount": constFormat.roundNumber(m2_amount, 0),
                    "custbody_scv_m2_unit_price": constFormat.roundNumber(m2_unit_price, 6),
                    "custbody_scv_m2_tax_amount": constFormat.roundNumber(m2_tax_amount, 0),
                };

                // log.error("SalesOrd: " + curRec.getValue("tranid"), values);
                record.submitFields({
                    type: curRec.type, id: curRec.id,
                    values: values,
                    options: {
                        enablesourcing: false, ignoreMandatoryFields: true
                    }
                });
            }
        }
        
        return {
            afterSubmit_CalcM2EinvoiceAmt
        };
    });
