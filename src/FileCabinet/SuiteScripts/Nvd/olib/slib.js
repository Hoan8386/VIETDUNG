/**
 * @NApiVersion 2.1
 */
define(['N/format', 'N/config', 'N/url', 'N/https', 'N/record', '../olib/lodash.min', 'N/search', 'N/ui/serverWidget', 'N/runtime'],
    function (format, config, url, https, record, _, search, ui, runtime) {
        function userPreferences() {
            try {
                let params = {};
                let loadConfig = config.load({
                    type: config.Type.USER_PREFERENCES
                });
                //date format
                params.dateformat = loadConfig.getValue({fieldId: 'DATEFORMAT'});
                // dateformat = dateformat.replace(/fm/gi, "");

                params.timezone = loadConfig.getValue({fieldId: 'TIMEZONE'});
                // let date2 = format.parse({value: date_cuoiky, type: format.Type.DATE, timezone: timezone});

                return params;
            } catch (e) {
                log.error('userPreferences', JSON.stringify(e));
            }
        }

        function getAccountPreference() {
            try {
                let obj = {};
                let configLoad = config.load({type: config.Type.ACCOUNTING_PREFERENCES});
                // let salesDiscAcct = config.getValue({fieldId: 'SALESDISCACCT'});
                // let salesDiscAcct = config.getValue({fieldId: 'ARACCOUNT'});
                obj.EXPENSEACCOUNT = configLoad.getValue({fieldId: 'EXPENSEACCOUNT'});
                return obj;
            } catch (e) {
                log.error('doGetAccountPreference', JSON.stringify(e));
            }
        }
        
        function createRecord(type, sublistId, options, sublist) {
            let rec = record.create({type: type, isDynamic: true});
            util.each(_.keys(options), function (o) {
                rec.setValue(o, options[o])
            });
            util.each(sublist, function (o) {
                rec.selectNewLine({sublistId: sublistId});
                util.each(_.keys(o), function (o1) {
                        rec.setCurrentSublistValue({
                            sublistId: sublistId,
                            fieldId: o1,
                            value: o[o1],
                        })
                    }
                );
                rec.commitLine({sublistId: sublistId});
            });
            return rec.save({enableSourcing: false, ignoreMandatoryFields: true});
        }
        
        function getRecordData(rec, sublistId, body, sublist) {
            let bodyObj = {};
            util.each(body, function (o) {
                if (_.includes(o, 'text')) {
                    let colName = _(o).split('-').head();
                    bodyObj[colName] = rec.getText(colName);
                } else
                    bodyObj[o] = rec.getValue(o);
            });
            let sublistList = [];
            if (sublistId) {
                let lineCnt = rec.getLineCount({sublistId: sublistId});
                for (let i = 0; i < lineCnt; i++) {
                    let sublistObj = {};
                    util.each(sublist, function (o) {
                        sublistObj[o] = rec.getSublistValue({sublistId: sublistId, fieldId: o, line: i});
                    });
                    sublistList.push(sublistObj);
                }
            }
            return {
                body: bodyObj,
                sublist: sublistList
            };
        }
        
        function searchData(id, filters, cols) {
            let objSearch = search.load({id: id});
            let ss = [];
            util.each(filters, function (f) {
                objSearch.filters.push(f);
            });
            let columns = objSearch.columns;
            let transactionSearchPagedData = objSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
                let transactionSearchPage = transactionSearchPagedData.fetch({index: i});
                transactionSearchPage.data.forEach(function (result) {
                    let obj = {};
                    if (_.isEmpty(cols)) {
                        util.each(columns, function (col) {
                            obj[col.label] = result.getValue(col);
                        });
                    } else {
                        util.each(cols, function (c) {
                            if (c === 'id') { //if col have id
                                obj[c] = result.id;
                            } else if (_.last(_.split(c, '_')) === 'text') {//if col as name_text
                                let findColumn = _.find(columns, function (findcol) {
                                    let name = _.replace(_.toLower(findcol.label), /\s+/g, '');
                                    name = _.replace(name, new RegExp('\\(', 'g'), '');
                                    name = _.replace(name, new RegExp('\\)', 'g'), '');
                                    return _.includes(name, _.head(_.split(c, '_')));
                                });
                                if (!_.isEmpty(findColumn))
                                    obj[c] = result.getText(findColumn);
                            } else {
                                let findColumn = _.find(columns, function (findcol) {
                                    let name = _.replace(_.toLower(findcol.label), /\s+/g, '');
                                    name = _.replace(name, new RegExp('\\(', 'g'), '');
                                    name = _.replace(name, new RegExp('\\)', 'g'), '');
                                    return _.includes(name, c);
                                });
                                if (!_.isEmpty(findColumn))
                                    obj[c] = result.getValue(findColumn);
                            }
                        });
                    }
                    ss.push(obj);
                });
            }
            return ss;
        }

        function searchData4(id, filters, cols) {
            let objSearch = search.load({id: id});
            let ss = [];
            util.each(filters, function (f) {
                objSearch.filters.push(f);
            });
            let columns = objSearch.columns;
            let transactionSearchPagedData = objSearch.runPaged({pageSize: 1000});
            for (let i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
                let transactionSearchPage = transactionSearchPagedData.fetch({index: i});
                transactionSearchPage.data.forEach(function (result) {
                    let obj = {};
                    if (_.isEmpty(cols)) {
                        util.each(columns, function (col) {
                            obj[col.label] = result.getValue(col);
                            try {
                                if (result.getValue(col) && result.getText(col) != null)
                                    obj[`${col.label}_text`] = result.getText(col);
                            } catch (e) {

                            }
                        });
                        // obj.id=result.id;
                    } else {
                        util.each(cols, function (c) {
                            if (c === 'id') { //if col have id
                                obj[c] = result.id;
                            } else if (_.last(_.split(c, '_')) === 'text') {//if col as name_text
                                let findColumn = _.find(columns, {label: _.head(_.split(c, '_'))});
                                if (!_.isEmpty(findColumn))
                                    obj[c] = result.getText(findColumn);
                            } else {
                                let findColumn = _.find(columns, {label: c});
                                if (!_.isEmpty(findColumn))
                                    obj[c] = result.getValue(findColumn);
                            }
                        });
                    }
                    ss.push(obj);
                });
            }
            return ss;
        }

        function writeErrorPage(respone, message, stack) {
            let form = ui.createForm('Có lỗi xảy ra!');
            let messageF = form.addField({
                id: 'custpage_message',
                type: ui.FieldType.INLINEHTML,
                label: 'Error Message'
            });
            message = `${message}</br></br>${_.last(stack)}`;
            messageF.defaultValue = '<p style="font-size: 25px; color: darksalmon">' + message + '</p>';
            let link = url.resolveScript({
                scriptId: runtime.getCurrentScript().id,
                deploymentId: runtime.getCurrentScript().deploymentId
            });
            form.addButton({
                id: 'custpage_back',
                label: 'Back',
                functionName: 'window.location.replace("' + link + '")'
            });
            respone.writePage(form);
        }

        function createSublist(form, options, labels, tab, isSelect) {
            let sublist;
            if (tab)
                sublist = form.addSublist({
                    id: "custpage_sublist",
                    label: `Results(${options.length})`,
                    tab: tab,
                    type: ui.SublistType.LIST,
                });
            else
                sublist = form.addSublist({
                    id: "custpage_sublist",
                    label: `Results(${options.length})`,
                    // tab: tab,
                    type: ui.SublistType.LIST,
                });
            if (isSelect)
                sublist.addField({
                    id: 'select',
                    type: ui.FieldType.CHECKBOX,
                    label: 'Select',
                });
            let obj = _.head(options);
            if (util.isArray(labels))
                util.each(_.keys(obj), function (key, i) {
                    let f = _.find(labels, {id: key});
                    if (_.isEmpty(f))
                        sublist.addField({
                            id: key,
                            type: ui.FieldType.TEXT,
                            label: key,
                        });
                    else {
                        let obj = {id: key, type: ui.FieldType.TEXT, label: key};
                        if (f.hasOwnProperty('type')) _.assign(obj, {type: f.type});
                        if (f.hasOwnProperty('label')) _.assign(obj, {label: f.label});
                        if (f.hasOwnProperty('source')) _.assign(obj, {source: f.source});
                        let field = sublist.addField(obj);
                        if (f.hasOwnProperty('displayType'))
                            field.updateDisplayType({displayType: f.displayType});
                    }
                });
            else
                util.each(_.keys(obj), function (key) {
                    sublist.addField({
                        id: key,
                        type: ui.FieldType.TEXT,
                        label: key,
                    });
                });
            util.each(options, function (option, i) {
                util.each(_.keys(option), function (key) {
                    try {
                        sublist.setSublistValue({
                            id: key,
                            line: i,
                            value: option[key],
                        });
                    } catch (e) {
                        // log.error("can not set " + key, option[key]);
                    }
                });
            });
            return sublist;
        }


        return {
            userPreferences: userPreferences,
            getAccountPreference: getAccountPreference,
            createRecord: createRecord,
            getRecordData: getRecordData,
            searchData: searchData,
            searchData4: searchData4,
            writeErrorPage: writeErrorPage,
            createSublist: createSublist
        }
    });
