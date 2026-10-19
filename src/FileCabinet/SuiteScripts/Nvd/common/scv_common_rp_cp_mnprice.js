define(['N/ui/serverWidget'],
    
    (serverWidget) => {
        
        const getSublistColMaster = () => {
            let sl = 'custpage_sl';//, source: 'item'
            let col_sl = [
                {id: 'stt', label: 'STT', type: 'integer', display: 'disabled'}
                , {
                    id: 'location_text',
                    label: 'Công đoạn/Xưởng',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'thanhpham_text',
                    label: 'Thành phẩm',
                    type: 'text',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {id: 'nvl_text', label: 'NVL', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {id: 'stockunit_text', label: 'ĐVT Kho', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'chenhlechgia',
                    label: 'C.Lệch giá',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {id: 'biendong', label: 'Biến động %', type: 'text', display: serverWidget.FieldDisplayType.INLINE}
                , {
                    id: 'quantity',
                    label: 'Số lượng Kỳ này',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'dongiatb',
                    label: 'Đơn giá TB Kỳ này',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'amount',
                    label: 'Thành tiền Kỳ này',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'quantity_prv',
                    label: 'Số lượng Kỳ trước',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'dongiatb_prv',
                    label: 'Đơn giá TB Kỳ trước',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {
                    id: 'amount_prv',
                    label: 'Thành tiền Kỳ trước',
                    type: 'float',
                    display: serverWidget.FieldDisplayType.INLINE
                }
                , {id: 'mainline', label: 'Main Line', type: 'text', display: 'hidden'}
            
            ];
            let sl_select = 'custpage_sl_select';
            let col_ss = [['location_text', 0], ['thanhpham_text', 1, 'sltext'], ['nvl_text', 2, 'sltext'], ['stockunit_text', 3, 'sltext']
                , ['quantity', 5], ['amount', 6], ['quantity_prv', 7], ['amount_prv', 8], ['mainline', 9]
            ];
            return {sl: sl, col_sl: col_sl, sl_select: sl_select, col_ss: col_ss}
        }
        
        const getColSSAdd = (libFunc, format, timezone, fromdate, todate, fromdate_prv, todate_prv) => {
            let ob_fromdate = format.parse({value: fromdate, type: format.Type.DATE, timezone: timezone});
            let ob_todate = format.parse({value: todate, type: format.Type.DATE, timezone: timezone});
            let ob_fromdate_prv = format.parse({value: fromdate_prv, type: format.Type.DATE, timezone: timezone});
            let ob_todate_prv = format.parse({value: todate_prv, type: format.Type.DATE, timezone: timezone});
            let sob_fromdate = convertDateStringYYYYMMDD(libFunc, ob_fromdate),
                sob_todate = convertDateStringYYYYMMDD(libFunc, ob_todate);
            let sob_fromdate_prv = convertDateStringYYYYMMDD(libFunc, ob_fromdate_prv),
                sob_todate_prv = convertDateStringYYYYMMDD(libFunc, ob_todate_prv);
            
            let col_ss_add = [{
                name: 'formulanumeric',
                formula: "case when {mainline} = '*' then {quantity} else 0 end",
                summary: 'SUM',
                sort: 'DESC'
            }
                , {
                    name: 'formulanumeric',
                    formula: "case when to_number(to_char({trandate},'YYYYMMDD')) >= " + sob_fromdate
                        + " and to_number(to_char({trandate},'YYYYMMDD')) <= " + sob_todate + " then round(Case when {mainline} = '*' then {quantity} when {item} like '62%' then nullif(1*{quantity}/decode(nvl({custbody_scv_orrginal_wo.custcol_scv_bom_std_qty},0),0,1,{custbody_scv_orrginal_wo.custcol_scv_bom_std_qty}),0) else {quantity} end,3) else 0 end"
                    ,
                    label: 'Số lượng Kỳ này',
                    summary: 'SUM'
                }
                , {
                    name: 'formulanumeric',
                    formula: "case when to_number(to_char({trandate},'YYYYMMDD')) >= " + sob_fromdate
                        + " and to_number(to_char({trandate},'YYYYMMDD')) <= " + sob_todate + " then (case when {mainline} = '*' then {amount} else nvl(round({effectiverate}*{quantity},2),{amount}) end) else 0 end"
                    ,
                    label: 'Thành tiền Kỳ này',
                    summary: 'SUM'
                }
                , {
                    name: 'formulanumeric',
                    formula: "case when to_number(to_char({trandate},'YYYYMMDD')) >= " + sob_fromdate_prv
                        + " and to_number(to_char({trandate},'YYYYMMDD')) <= " + sob_todate_prv + " then round(Case when {mainline} = '*' then {quantity} when {item} like '62%' then nullif(1*{quantity}/decode(nvl({custbody_scv_orrginal_wo.custcol_scv_bom_std_qty},0),0,1,{custbody_scv_orrginal_wo.custcol_scv_bom_std_qty}),0) else {quantity} end,3) else 0 end"
                    ,
                    label: 'Số lượng Kỳ trước',
                    summary: 'SUM'
                }
                , {
                    name: 'formulanumeric',
                    formula: "case when to_number(to_char({trandate},'YYYYMMDD')) >= " + sob_fromdate_prv
                        + " and to_number(to_char({trandate},'YYYYMMDD')) <= " + sob_todate_prv + " then (case when {mainline} = '*' then {amount} else nvl(round({effectiverate}*{quantity},2),{amount}) end) else 0 end"
                    ,
                    label: 'Thành tiền Kỳ trước',
                    summary: 'SUM'
                }
                , {name: 'mainline', summary: 'GROUP'}
            ];
            let splice = [{splice_col_start: 4}];
            
            return {
                col_ss_add: col_ss_add,
                splice: splice,
                ob_fromdate: ob_fromdate,
                ob_todate: ob_todate,
                ob_fromdate_prv: ob_fromdate_prv,
                ob_todate_prv: ob_todate_prv
                ,
                sob_fromdate: sob_fromdate,
                sob_todate: sob_todate,
                sob_fromdate_prv: sob_fromdate_prv,
                sob_todate_prv: sob_todate_prv
            };
        }
        
        const convertDateStringYYYYMMDD = (libFunc, dInput) => {
            let dOutput = '';
            if (libFunc.isContainValue(dInput)) {
                dOutput = dInput.getFullYear() + '' + libFunc.makePrefix(dInput.getMonth() + 1, 2, '0') + '' + libFunc.makePrefix(dInput.getDate(), 2, '0');
            }
            return dOutput;
        }
        
        const setValueColLine = (libFunc, list_ss, i) => {
            let dongiatb = !!list_ss[i].quantity && Number(list_ss[i].quantity) !== 0 ? (list_ss[i].amount / list_ss[i].quantity).toFixed(3) * 1 : '';
            let dongiatb_prv = !!list_ss[i].quantity_prv && Number(list_ss[i].quantity_prv) !== 0 ? (list_ss[i].amount_prv / list_ss[i].quantity_prv).toFixed(3) * 1 : '';
            let chenhlechgia = (!!dongiatb && !!dongiatb_prv) ? ((dongiatb || 0) - (dongiatb_prv || 0)).toFixed(3) * 1 : '';
            let biendong = !!dongiatb_prv && !!chenhlechgia ? (100 * chenhlechgia / dongiatb_prv).toFixed(2) + ' %' : '';
            let biendong_ep = !!dongiatb_prv && !!chenhlechgia ? (chenhlechgia / dongiatb_prv).toFixed(2) * 1 : '';
            list_ss[i].dongiatb = dongiatb || '';
            list_ss[i].dongiatb_prv = dongiatb_prv || '';
            list_ss[i].chenhlechgia = chenhlechgia || '';
            list_ss[i].biendong = biendong || '';
            list_ss[i].biendong_ep = biendong_ep || '';
        }
        
        const pushFilter = (search, libFunc, filters, subsidiary, mainline, location, thanhpham, item, col_ss_add) => {
            filters.push(search.createFilter({
                name: 'subsidiary',
                operator: search.Operator.ANYOF,
                values: subsidiary
            }));
            filters.push(search.createFilter({
                name: 'mainline',
                join: 'createdFrom',
                operator: search.Operator.IS,
                values: true
            }));
            if (!mainline || mainline === 'F') {
                filters.push(search.createFilter({name: 'mainline', operator: search.Operator.IS, values: true}));
            }
            if (libFunc.isContainValue(location)) {
                filters.push(search.createFilter({
                    name: 'location',
                    operator: search.Operator.ANYOF,
                    values: location
                }));
            }
            if (libFunc.isContainValue(thanhpham)) {
                filters.push(search.createFilter({
                    name: 'item',
                    join: 'createdFrom',
                    operator: search.Operator.ANYOF,
                    values: thanhpham
                }));
            }
            if (libFunc.isContainValue(item)) {
                filters.push(search.createFilter({name: 'item', operator: search.Operator.ANYOF, values: item}));
            }
            
            let fl1 = "case when to_number(to_char({trandate}, 'YYYYMMDD')) >= " + col_ss_add.sob_fromdate
                + " and to_number(to_char({trandate}, 'YYYYMMDD')) <= " + col_ss_add.sob_todate + " then 1"
                + " when to_number(to_char({trandate}, 'YYYYMMDD')) >= " + col_ss_add.sob_fromdate_prv
                + " and to_number(to_char({trandate}, 'YYYYMMDD')) <= " + col_ss_add.sob_todate_prv + " then 1"
                + " else 0 end";
            let fil1 = search.createFilter({
                name: 'formulatext',
                formula: fl1,
                operator: search.Operator.IS,
                values: '1'
            });
            filters.push(fil1);
        }
        
        return {
            getSublistColMaster,
            getColSSAdd,
            convertDateStringYYYYMMDD,
            setValueColLine,
            pushFilter
        };
        
    });
