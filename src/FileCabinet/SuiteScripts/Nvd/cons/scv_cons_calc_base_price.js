/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Nov 2024         Khanh Tran              Init & create file, Tính giá cơ sở của Item chuẩn và Item lệch chuẩn theo Conversion Rate, from ms.Ngọc(https://app.clickup.com/t/86cx3r94u)
 */
define(['N/search', 'N/query',
    '../lib/scv_lib_cs.js',
    '../cons/scv_cons_format.js',
    '../cons/scv_cons_search_bp_item_chuan.js',
    '../cons/scv_cons_search_bp_items.js',
    '../cons/scv_cons_search_bp_rate.js',
    '../cons/scv_cons_search_bp_b_type.js',
    '../cons/scv_cons_search_inter_bp.js',
    '../cons/scv_cons_ordertype.js',
],
function(search, query,
    libCs,
    constFormat,
    constSearchBPItemChuan,
    constSearchBPItems,
    constSearchBPRate,
    cSearchBpBType,
    cSearchIbp,
    constOrderType
) {
    const addButtonCalcBasePrice = (form, curRec) => {
        let isShow = isShowBtnCalcBasePrice(curRec);
        if(!isShow) return;

        form.addButton({
            id: 'custpage_scv_btn_calc_base_price',
            label: 'Tính giá cơ sở'
        });
    }

    const isShowBtnCalcBasePrice = (curRec) => {
        if(!curRec.id) return false;

        let slItem = 'item';
        for(let i = 0; i < curRec.getLineCount(slItem); i++){
            let bp_rate = curRec.getSublistValue(slItem, 'custcol_scv_bp_rate', i);
            if(bp_rate || bp_rate === 0) return true;
        }
        
        return false;
    }

    const addEventClickBtnCalcBasePrice = (scriptContext) => {
        let btnLoad = document.getElementById('custpage_scv_btn_calc_base_price');
        if(btnLoad){
            btnLoad.onclick = async () => {
                libCs.showLoadingDialog(true);
                try {
                    await clickBtnCalcBasePrice(scriptContext);//1.3
                } catch (error) {
                    alert(error.toString())
                }
                
                libCs.showLoadingDialog(false);
            };
        }
    }

    const clickBtnCalcBasePrice = async (scriptContext) => {
        let curRec = scriptContext.currentRecord;
        let itemIds = [], arrSlItem = [];
        let slItem = 'item';
        for(let i = 0; i < curRec.getLineCount(slItem); i++){
            let bp_rate = curRec.getSublistValue(slItem, 'custcol_scv_bp_rate', i);
            if(bp_rate || bp_rate === 0){
                let item = curRec.getSublistValue(slItem, 'item', i);
                let bang_gia_dai_ly = curRec.getSublistValue(slItem, 'custcol_scv_bang_gia_dai_ly', i);
                let bp_vat = curRec.getSublistText(slItem, 'custcol_scv_bp_vat', i);
                let unit = curRec.getSublistValue(slItem, 'units_display', i);
                let unit_conversion_rate = curRec.getSublistValue(slItem, 'custcol_scv_unit_conversion_rate', i) || 1;
                let ori_lineid = curRec.getSublistValue(slItem, 'custcol_scv_ori_lineid', i);
                arrSlItem.push({
                    item, bang_gia_dai_ly, bp_vat, unit, unit_conversion_rate, ori_lineid
                })
                
                itemIds.push(item)
            }
        }

        if(arrSlItem.length == 0) return;

        let arrBasePrice = await getDataBasePrice(curRec, arrSlItem, itemIds); 
        updateBasePriceSlItem(curRec, arrBasePrice)
    }

    const updateBasePriceSlItem = (curRec, arrBasePrice) => {
        let slItem = 'item';
        for(let i = 0; i < curRec.getLineCount(slItem); i++){
            let item = curRec.getSublistValue(slItem, 'item', i);
            let ori_lineid = curRec.getSublistValue(slItem, 'custcol_scv_ori_lineid', i);
            let objUpd = arrBasePrice.find(e => e.item == item && e.ori_lineid == ori_lineid);
            if(!objUpd) continue;
            if(curRec.isDynamic){
                curRec.selectLine(slItem, i);
                curRec.setCurrentSublistValue({sublistId: slItem, fieldId: 'custcol_scv_bp_rate', value: objUpd.bp_rate * 1});
                curRec.commitLine(slItem);
            }else{
                curRec.setSublistValue({sublistId: slItem, fieldId: 'custcol_scv_bp_rate', line: i, value: objUpd.bp_rate * 1});
                if(curRec.type === 'purchaseorder'){
                    let rate = objUpd.bp_rate * 1;
                    if(objUpd.bp_vat == 'T'){
                        rate = rate / (1 + objUpd.taxrate1/100);
                    }
                    curRec.setSublistValue({sublistId: slItem, fieldId: 'rate', line: i, value: rate});
                }
            }
        }
    }

    const getDataBasePrice = async (curRec, arrSlItem, itemIds) => {
        let order_type = curRec.getValue('custbody_scv_order_type');
        let entity = curRec.getValue('entity');
        let currency = curRec.getValue('currency');
        let arrItem = getDataItem(itemIds, ['custitem_scv_group_lv2']);
        let [arrSS_bpItems, arrSS_bpRate, arrSS_bpItemChuan, arrSS_ibp] = await fetchMultipleSavedSearches(curRec, itemIds);
        arrSlItem.forEach(obj => {
            obj.bp_rate = 0;
            obj.bp_vat = obj.bp_vat ? 'T' : 'F';
            let objSS_bpTrans = arrSS_bpItems.find(e => e.item == obj.item);
            if(!objSS_bpTrans) return;

            if(obj.bang_gia_dai_ly == true){//1.1
                let quy_tac_ss = objSS_bpTrans.quy_tac_ss ? objSS_bpTrans.quy_tac_ss.replaceAll('-', '_') : '';
                let key_mapping = objSS_bpTrans[quy_tac_ss];
                key_mapping = key_mapping ? key_mapping : objSS_bpTrans.key_mapping;
                let arrSS_bpRate_ft = arrSS_bpRate.filter(e => {
                    return e.bp_vat == obj.bp_vat &&
                        e.nhom_hang == objSS_bpTrans.nhom_hang &&
                        e.key_mapping == key_mapping &&
                        (objSS_bpTrans.ma_mau ? e.ma_mau.includes(objSS_bpTrans.ma_mau) : true) &&
                        ((objSS_bpTrans.item_type == 'Kit/Package' || objSS_bpTrans.item_type == 'Item Group') ? (e.combo_id == 'T') : (e.combo_id != 'T'));
                });
                
                if(arrSS_bpRate_ft.length == 0) return;
    
                let objSS_bpRate = arrSS_bpRate_ft.find(e => e.customer == entity);
                if(!objSS_bpRate) objSS_bpRate = arrSS_bpRate_ft[0];
    
                let bp_rate = obj.unit_conversion_rate * objSS_bpRate.base_price;
                obj.bp_rate = parseFloat(bp_rate.toFixed(8));
            }else{//1.4
                if(objSS_bpTrans.item_parent_id){
                    let objSS_bpItemChuan = arrSS_bpItemChuan.find(e => e.key_mapping == objSS_bpTrans.item_parent_id + currency);
                    if(!objSS_bpItemChuan) return;

                    obj.bp_rate = objSS_bpItemChuan.base_price * obj.unit_conversion_rate;
                }else{
                    let objSS_bpItemChuan = arrSS_bpItemChuan.find(e => e.key_mapping == objSS_bpTrans.item + currency);
                    if(!objSS_bpItemChuan) return;

                    obj.bp_rate = objSS_bpItemChuan.base_price;
                }

                if(obj.bp_vat == 'T'){
                    obj.bp_rate = obj.bp_rate  * (1 + obj.taxrate1/100);
                }
            };

            if(!obj.bp_rate) return;
            if(order_type == constOrderType.RECORDS.MUA_BAN_NOI_BO.ID && curRec.type == "purchaseorder"){
                let objItem = arrItem.find(e => e.id == obj.item);
                let objSS_ibp = arrSS_ibp.find(e => e.ipb_id == objItem.custitem_scv_group_lv2);
                if(objSS_ibp){
                    obj.bp_rate = obj.bp_rate * objSS_ibp.he_so_mua_ban_nb;
                }
            }
        })

        return arrSlItem;
    }

    const getDataItem = (itemIds, columns) => {
        if(itemIds.length === 0) return [];
        let sqlQuery = `SELECT id, ${columns.join(', ')} FROM item
            WHERE id IN ('${itemIds.join("','")}') AND isinactive = 'F'`;
        
        let resultSearch = query.runSuiteQL({
            query: sqlQuery,
            params: [],
            pageSize: 1000
        });

        return resultSearch.asMappedResults();
    }

    const fetchMultipleSavedSearches = async (curRec, itemIds) => {
        let [arrSS_bpItems, arrSS_bpRate, arrSS_bpItemChuan, arrSS_ibp] = await Promise.all([
            getDataSS_bpItems(itemIds),
            getDataSS_bpRate(curRec),
            getDataSS_bpItemChuan(itemIds),
            getDataSS_ibp(),
        ]);
        return [arrSS_bpItems, arrSS_bpRate, arrSS_bpItemChuan, arrSS_ibp];
    };

    const getDataSS_ibp = () => { 
        let myFilters = [];
        return cSearchIbp.getDataSource(myFilters);
    }

    const getDataSS_bpBType = () => { 
        let myFilters = [];
        return cSearchBpBType.getDataSource(myFilters);
    }

    const getDataSS_bpItemChuan = (itemIds) => { 
        let myFilters = [];
        myFilters.push(
            search.createFilter({name: 'internalid', operator: 'anyof', values: itemIds})
        );

        return constSearchBPItemChuan.getDataSource(myFilters);
    }

    const getDataSS_bpRate = (curRec) => {
        let myFilters = [];
        let trandate = curRec.getValue('trandate');
        let subsidiary = curRec.getValue('subsidiary');
        let currency = curRec.getValue('currency');
        if(trandate){
            trandate = constFormat.formatDate(trandate);
            myFilters.push(
                search.createFilter({name: 'custrecord_scv_sales_price_start_date', operator: 'onorbefore', values: trandate})
            );
            myFilters.push(
                search.createFilter({name: 'custrecord_scv_sales_price_end_date', operator: 'onorafter', values: trandate})
            )
        }

        if(subsidiary){
            myFilters.push(
                search.createFilter({name: 'formulatext', formula: '{custrecord_scv_sales_price_sub.internalid}', operator: 'is', values: subsidiary})
            )
        } 
        
        if(currency){
            myFilters.push(
                search.createFilter({name: 'custrecord_scv_sales_price_currency', operator: 'anyof', values: currency})
            )
        } 
        
        return constSearchBPRate.getDataSource(myFilters);
    }

    const getDataSS_bpItems= (itemIds) => {
        let myFilters = [];
        myFilters.push(
            search.createFilter({name: 'internalid', operator: 'anyof', values: itemIds})
        );

        return constSearchBPItems.getDataSource(myFilters);
    }

    const updateRecordWithBasePrices = async (scriptContext) => {
        let triggerType = scriptContext.type;
        let curRec = scriptContext.newRecord;        
        let itemIds = [], arrSlItem = [], arrSlItem_old = [], arrDataUpd = [];
        let slItem = 'item';
        if(triggerType == "edit"){
            let oldRec = scriptContext.oldRecord;
            if(curRec.getValue('trandate') == oldRec.getValue('trandate') && curRec.getValue('entity') == oldRec.getValue('entity') &&
                curRec.getValue('subsidiary') == oldRec.getValue('subsidiary') && curRec.getValue('currency') == oldRec.getValue('currency')){
                for(let i = 0; i < oldRec.getLineCount(slItem); i++){
                    let ori_lineid = curRec.getSublistValue(slItem, 'custcol_scv_ori_lineid', i);
                    let bang_gia_dai_ly = curRec.getSublistValue(slItem, 'custcol_scv_bang_gia_dai_ly', i);
                    let bp_vat = curRec.getSublistValue(slItem, 'custcol_scv_bp_vat', i);
                    arrSlItem_old.push({
                        ori_lineid, bang_gia_dai_ly, bp_vat
                    })
                }
            }
            
            for(let i = 0; i < curRec.getLineCount(slItem); i++){
                let input_base_price = curRec.getSublistValue(slItem, 'custcol_scv_input_base_price', i);
                if(input_base_price) continue;

                let item = curRec.getSublistValue(slItem, 'item', i);
                let bang_gia_dai_ly = curRec.getSublistValue(slItem, 'custcol_scv_bang_gia_dai_ly', i);
                let bp_vat = curRec.getSublistValue(slItem, 'custcol_scv_bp_vat', i);
                let unit = curRec.getSublistValue(slItem, 'units_display', i);
                let unit_conversion_rate = curRec.getSublistValue(slItem, 'custcol_scv_unit_conversion_rate', i) || 1;
                let ori_lineid = curRec.getSublistValue(slItem, 'custcol_scv_ori_lineid', i);
                let taxrate1 = curRec.getSublistValue(slItem, 'taxrate1', i) * 1;
                arrSlItem.push({
                    item, bang_gia_dai_ly, bp_vat, unit, unit_conversion_rate, ori_lineid, taxrate1
                })
            }
            
            if(arrSlItem.length == 0) return;
            if(arrSlItem_old.length > 0){
                arrSlItem.forEach(obj => {
                    let objOld = arrSlItem_old.find(e => e.ori_lineid == obj.ori_lineid);
                    if(objOld){
                        if(objOld.bang_gia_dai_ly != obj.bang_gia_dai_ly || objOld.bp_vat != obj.bp_vat){
                            arrDataUpd.push(obj);
                        }
                    }else{
                        arrDataUpd.push(obj);
                    }
                })
            }else{
                arrDataUpd = arrSlItem;
            }
           
        }else if(triggerType == "create"){
            for(let i = 0; i < curRec.getLineCount(slItem); i++){
                let bp_rate = curRec.getSublistValue(slItem, 'custcol_scv_bp_rate', i);
                if(!bp_rate && bp_rate !== 0){
                    let item = curRec.getSublistValue(slItem, 'item', i);
                    let bang_gia_dai_ly = curRec.getSublistValue(slItem, 'custcol_scv_bang_gia_dai_ly', i);
                    let bp_vat = curRec.getSublistValue(slItem, 'custcol_scv_bp_vat', i);
                    let unit = curRec.getSublistValue(slItem, 'units_display', i);
                    let unit_conversion_rate = curRec.getSublistValue(slItem, 'custcol_scv_unit_conversion_rate', i) || 1;
                    let ori_lineid = curRec.getSublistValue(slItem, 'custcol_scv_ori_lineid', i);
                    let taxrate1 = curRec.getSublistValue(slItem, 'taxrate1', i) * 1;
                    arrDataUpd.push({
                        item, bang_gia_dai_ly, bp_vat, unit, unit_conversion_rate, ori_lineid, taxrate1
                    })
                    
                }
            };
        }
        
        if(arrDataUpd.length == 0) return;
        arrDataUpd.forEach(obj => {
            itemIds.push(obj.item)
        });

        let arrBasePrice = await getDataBasePrice(curRec, arrDataUpd, itemIds);
        updateBasePriceSlItem(curRec, arrBasePrice);
    }

    return {
        addButtonCalcBasePrice,
        addEventClickBtnCalcBasePrice,
        updateRecordWithBasePrices,

    };
    
});
    