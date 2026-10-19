/**
 * @NApiVersion 2.1
 */
define(['N/record', 'N/query', 'N/search'],
    
    (record, query, search) => {
    
        const NAME_TOGEN = 'ToBeGen';
        const NAME_TOBE_GENERATED = 'To Be Generated';
    
        const RecordCode = {
            CURRENT_CODE: 'customrecord_scv_current_code',
            CURRENT_CODE_UNQ: 'customrecord_scv_current_codeunq',
            
            SALES_PRICE: 'customrecord_scv_sales_price',
            SALES_TERM: 'customrecord_scv_st',
            SALES_PROMOTION_TERM: 'customrecord_scv_spt',
            PHAN_DOAN_SAN_PHAM: 'customrecord_scv_group_level'
        }
        
        const PrefixCode = {};
        PrefixCode[RecordCode.SALES_PRICE] = 'BG_';
        PrefixCode[RecordCode.SALES_TERM] = 'PA';
        PrefixCode[RecordCode.SALES_PROMOTION_TERM] = 'PA';
        
        const FieldIdCode = {};
        FieldIdCode[RecordCode.SALES_PRICE] = 'name';
        FieldIdCode[RecordCode.SALES_TERM] = 'name';
        FieldIdCode[RecordCode.SALES_PROMOTION_TERM] = 'name';
        
        const pushPrefixCode = (recType, value) => {
            PrefixCode[recType] =value;
        }
        
        const pushFieldIdCode = (recType, value) => {
            PrefixCode[recType] =value;
        }
        
        const generateCurrentValueCode = (prefix, times, lengthSuffix) => {
            let currentValueCode = '';
            if(times < 5) {
                let currentValue = 1;
                let sql = `select s.id, s.custrecord_scv_cc_currentvalue currentvalue from ${RecordCode.CURRENT_CODE} s where s.name = ?`;
                let results = query.runSuiteQL({query: sql, params: [prefix]}).asMappedResults();
                if (results && results.length > 0) {
                    currentValue = results[0].currentvalue * 1 + 1;
                    record.submitFields({type: RecordCode.CURRENT_CODE, id: results[0].id, values: {custrecord_scv_cc_currentvalue: currentValue}});
                    currentValueCode = prefix + ((currentValue + '').padStart(lengthSuffix, '0'));
                } else {
                    currentValueCode = prefix + ((currentValue + '').padStart(lengthSuffix, '0'));
                    let recCc = record.create({type: RecordCode.CURRENT_CODE});
                    recCc.setValue('name', prefix);
                    recCc.setValue('custrecord_scv_cc_currentvalue', currentValue);
                    recCc.setValue('externalid', currentValueCode);
                    try {
                        recCc.save();
                    } catch (e) {
                        log.error('exception recGc', e);
                        currentValueCode = generateCurrentValueCode(prefix, times + 1, lengthSuffix);
                    }
                }
                
                let recCcUnq = record.create({type: RecordCode.CURRENT_CODE_UNQ});
                recCcUnq.setValue('name', currentValueCode);
                recCcUnq.setValue('externalid', currentValueCode);
                try {
                    recCcUnq.save();
                } catch (e) {
                    log.error('exception recCcUnq', e);
                    currentValueCode = generateCurrentValueCode(prefix, times + 1, lengthSuffix);
                }
            }
            return currentValueCode;
        }
        
        const getCurrentValueCodeSalesBasePrice = (newRecord) => {
            let recType = newRecord.type;
            let currentValueCode = '';
            let price_cate = newRecord.getValue('custrecord_scv_sales_price_cate');
            let price_start_date = newRecord.getValue('custrecord_scv_sales_price_start_date');
            if(price_cate && price_start_date) {
                let lkClass = search.lookupFields({type: RecordCode.PHAN_DOAN_SAN_PHAM, id: price_cate, columns: ['custrecord_scv_item_group']});
                let strDateForCode = String(price_start_date.getDate()).padStart(2, '0') + String(price_start_date.getMonth() + 1).padStart(2, 0) + String(price_start_date.getFullYear()).substring(2);
                currentValueCode = PrefixCode[recType] + lkClass.custrecord_scv_item_group + '_' + strDateForCode;
            }
            return currentValueCode;
        }
        
        const getCurrentValueCodeSalesTerm = (newRecord) => {
            let recType = newRecord.type;
            let currentValueCode = '';
            let entityId = newRecord.getValue('custrecord_scv_st_customer');
            
            if(entityId) {
                let lkEntity = search.lookupFields({type: search.Type.ENTITY, id: entityId, columns: ['custentity_scv_short_code']});
                let prefix = PrefixCode[recType] + lkEntity.custentity_scv_short_code;
                currentValueCode = generateCurrentValueCode(prefix, 0, 4);
            }
            return currentValueCode;
        }
        
        const getCurrentValueCodeSalesPromotionTerm = (newRecord) => {
            let recType = newRecord.type;
            let currentValueCode = '';
            let spt_group = newRecord.getValue('custrecord_scv_spt_group');
            
            if(spt_group) {
                let lkClass = search.lookupFields({type: RecordCode.PHAN_DOAN_SAN_PHAM, id: spt_group, columns: ['custrecord_scv_item_group']});
                let prefix = PrefixCode[recType] + lkClass.custrecord_scv_item_group;
                currentValueCode = generateCurrentValueCode(prefix, 0, 4);
            }
            return currentValueCode;
        }
        
        
        const getCurrentValueCode = (newRecord, prefixCodeValue, fieldIdCodeValue) => {
            let recType = newRecord.type;
            pushCodeConfig(recType, prefixCodeValue, fieldIdCodeValue);
            
            let prefix = PrefixCode[recType];
            let lengthSuffix = 4;
            let currentValueCode;
            if(recType === RecordCode.SALES_PRICE) {
                currentValueCode = getCurrentValueCodeSalesBasePrice(newRecord);
            } else if(recType === RecordCode.SALES_TERM) {
                currentValueCode = getCurrentValueCodeSalesTerm(newRecord);
            } else if(recType === RecordCode.SALES_PROMOTION_TERM) {
                currentValueCode = getCurrentValueCodeSalesPromotionTerm(newRecord);
            } else {
                currentValueCode = generateCurrentValueCode(prefix, 0, lengthSuffix);
            }
            return currentValueCode;
        }
        
        const pushCodeConfig = (recType, prefixCodeValue, fieldIdCodeValue) => {
            if(prefixCodeValue && fieldIdCodeValue) {
                pushPrefixCode(recType, prefixCodeValue);
                pushFieldIdCode(recType, fieldIdCodeValue);
            }
        }
        
        const generateAndSetCode = (newRecord, tgType, prefixCodeValue, fieldIdCodeValue) => {
            if(tgType === 'create' || tgType === 'edit' || tgType === 'copy') {
                let recType = newRecord.type;
                
                let currentValue = newRecord.getValue(FieldIdCode[recType]);
                if((!currentValue || currentValue === NAME_TOGEN) && PrefixCode[recType]) {
                    let fieldIdCode = FieldIdCode[recType];
                    let currentValueCode = getCurrentValueCode(newRecord, prefixCodeValue, fieldIdCodeValue);
                    if (currentValueCode) {
                        newRecord.setValue(fieldIdCode, currentValueCode);
                    }
                }
            }
        }
        return {NAME_TOGEN, NAME_TOBE_GENERATED, generateAndSetCode, generateCurrentValueCode}
    });
