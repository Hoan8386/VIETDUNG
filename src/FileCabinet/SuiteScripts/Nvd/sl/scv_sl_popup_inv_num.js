/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/search', 'N/ui/serverWidget',
        '../lib/scv_lib_common_html.js'],
    (query, search, serverWidget,
     libHTML) => {
        
        const onRequest = ({request, response}) => {
            let params = request.parameters;
            let method = request.method;
            if (method === 'POST') {
                let objRes = {isSuccess: true, msg: '', response: null};
                log.audit('post_getdata_lot', params)
                try {
                    //getDataInventoryNumber
                    objRes.response = getListItemsAvailable({
                        arrLotId: !!params.invNumsId ? params.invNumsId?.split(',') : [],
                        locationId: params.locationId,
                        itemId: params.itemId,
                        transtype: params.transtype
                    });
                } catch (e) {
                    objRes.isSuccess = false;
                    objRes.msg = e.message;
                }
                log.audit('result_response', objRes);
                response.write(JSON.stringify(objRes));
            } else {
                let form = serverWidget.createForm({title: ' ', hideNavBar: true});
                form.clientScriptModulePath = '../cs/scv_cs_sl_popup_inv_num.js';
                form.addButton({id: 'custpage_btn_ok', label: 'OK', functionName: 'updateLine'});
                form.addButton({id: 'custpage_btn_close', label: 'Close', functionName: 'debugger;closePopup(true);'});
                libHTML.addClassBtnSubmit(form, 'custpage_btn_ok');
                libHTML.addClassBtnSubmit(form, 'custpage_btn_close');
                let sublist = form.addSublist({
                    id: 'custpage_sublist',
                    label: 'Serial/Lot Number',
                    type: serverWidget.SublistType.INLINEEDITOR
                });
                sublist.addField({id: 'select', type: 'checkbox', label: 'Mark'});
                sublist.addField({
                    id: 'custpage_col_invnum_id',
                    type: 'text',
                    label: 'Serial/Lot Number ID'
                }).updateDisplayType({
                    displayType: 'hidden'
                });
                sublist.addField({
                    id: 'custpage_col_invnum_display',
                    type: 'text',
                    label: 'Serial/Lot Number'
                }).updateDisplayType({
                    displayType: 'disabled'
                });
                sublist.addField({
                    id: 'custpage_col_binnumber_id',
                    type: 'text',
                    label: 'Bin'
                }).updateDisplayType({
                    displayType: 'hidden'
                });
                sublist.addField({
                    id: 'custpage_col_binnumber_display',
                    type: 'text',
                    label: 'BIN'
                }).updateDisplayType({
                    displayType: 'disabled'
                });
                sublist.addField({
                    id: 'custpage_col_inventorystatus_id',
                    type: 'text',
                    label: 'Status'
                }).updateDisplayType({
                    displayType: 'hidden'
                });
                sublist.addField({
                    id: 'custpage_col_inventorystatus_display',
                    type: 'text',
                    label: 'Status'
                }).updateDisplayType({
                    displayType: 'disabled'
                });
                sublist.addField({id: 'custpage_col_available', type: 'float', label: 'Khả dụng'}).updateDisplayType({
                    displayType: 'disabled'
                });
                sublist.addField({id: 'custpage_col_color_seri', type: 'text', label: 'Seri Màu'}).updateDisplayType({
                    displayType: 'disabled'
                });
                sublist.addField({id: 'custpage_col_mfg_date', type: 'text', label: 'Ngày SX'}).updateDisplayType({
                    displayType: 'disabled'
                });
                sublist.addField({id: 'custpage_col_import_date', type: 'text', label: 'Ngày nhập hàng'}).updateDisplayType({
                    displayType: 'disabled'
                });
                response.writePage(form);
            }
        };
        
        const getDataInventoryNumber = ({arrLotId, itemId, locationId}) => {
            let filters = [];
            if (Array.isArray(arrLotId) && arrLotId.length > 0) {
                filters.push(search.createFilter({
                    name: 'internalid',
                    operator: 'anyof',
                    values: arrLotId
                }));
            } else {
                filters.push(search.createFilter({
                    name: 'item',
                    operator: 'anyof',
                    values: itemId
                }));
                filters.push(search.createFilter({
                    name: 'location',
                    operator: 'anyof',
                    values: locationId
                }));
                filters.push(search.createFilter({
                    name: 'quantityavailable',
                    operator: 'greaterthan',
                    values: 0
                }));
            }
            log.audit('filters', filters);
            let searchObj = search.create({
                type: search.Type.INVENTORY_NUMBER,
                filters: filters,
                columns: ['inventorynumber', 'custitemnumber_scv_item_num_color_seri', {
                    name: 'custitemnumber_aln_manufactured_date',
                    sort: 'ASC'
                }, {name: 'custitemnumber_scv_import_date', sort: 'ASC'}, 'quantityavailable']
            });
            const cols = searchObj.columns;
            log.audit('searchObj', searchObj)
            let searchData = searchObj.run().getRange(0, 1000);
            const szData = searchData.length;
            let results = [];
            for (let i = 0; i < szData; i++) {
                let available = searchData[i].getValue(cols[4]);
                if (available > 0) {
                    results.push({
                        inventorynumber: searchData[i].id.toString(),
                        inventorynumber_display: searchData[i].getValue(cols[0]),
                        color_seri: searchData[i].getValue(cols[1]),
                        mfg_date: searchData[i].getValue(cols[2]),
                        import_date: searchData[i].getValue(cols[3]),
                        available: available,
                    });
                }
            }
            return results;
        };
        
        const getListItemsAvailable = ({arrLotId, itemId, locationId, transtype}) => {
            let params, strWhere;
            if (Array.isArray(arrLotId) && arrLotId.length > 0) {
                params = arrLotId;
                strWhere = `in.id in (${arrLotId.map(() => '?').join(',')})`;
            } else {
                params = [locationId, itemId];
                strWhere = 'and ib.location = ? and ib.item = ?';
            }
            let fieldAvailable;
            if(transtype === 'itemship') {
                fieldAvailable = 'ib.quantityavailable available';
            } else {
                fieldAvailable = '(ib.quantityavailable - ib.committedqtyperseriallotnumber) available';
                strWhere += ' and (ib.quantityavailable - ib.committedqtyperseriallotnumber) > 0';
            }
            let sqlItemAvailable = `
                select  ib.inventorynumber, in.inventorynumber inventorynumber_display,
                    ${fieldAvailable}, ib.binnumber, b.binnumber binnumber_display, ib.location, in.expirationdate, ib.inventorystatus, is.name inventorystatus_display,
                    in.custitemnumber_scv_item_num_color_seri color_seri, in.custitemnumber_aln_manufactured_date mfg_date, in.custitemnumber_scv_import_date import_date
                from inventorybalance ib
                join location l on ib.location = l.id
                left join inventorynumber in on ib.inventorynumber = in.id
                left join inventorystatus is on ib.inventorystatus = is.id
                left join bin b on ib.binnumber = b.id
                where ib.quantityavailable > 0 and l.makeinventoryavailable = 'T' ${strWhere} and is.inventoryavailable = 'T'
                order by ib.item, in.custitemnumber_aln_manufactured_date, in.custitemnumber_scv_import_date
            `;
            return query.runSuiteQL({query: sqlItemAvailable, params: params}).asMappedResults();
        }
        
        return {
            onRequest
        };
    });