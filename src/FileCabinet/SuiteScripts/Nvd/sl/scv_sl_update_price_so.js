/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget', 'N/redirect',
    'N/cache', 'N/ui/message', 'N/task',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_search_so_nd_6.js'
],
    (
        serverWidget, redirect,
        cache, message, task,
        lbf,
        searchSO
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let response = scriptContext.response;
            let params = request.parameters;

            let myCache = cache.getCache({
                name: 'cUpdateStt',
                scope: cache.Scope.PRIVATE
            });
            if(request.method == "GET") {
                let MainForm = onCreateFormUI(params, myCache);
                let searchResult = getDataSalesOrder();
                onRenderData(MainForm.sublist, searchResult);
                response.writePage(MainForm.form);
            } else {
                let arrSublist = getDataSublistResult(request);
                // run map/ reduce
                let mrTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_scv_mr_update_price_so',
                    deploymentId: 'customdeploy_scv_mr_update_price_so'
                });
                mrTask.params = {
                    custscript_scv_update_price_so: JSON.stringify(arrSublist),
                };
                let mrTaskId = mrTask.submit();
                myCache.put({
                    key: 'mrTaskId',
                    value: mrTaskId
                });
                redirect.toSuitelet({
                    scriptId: "customscript_scv_sl_update_price_so",
                    deploymentId: "customdeploy_scv_sl_update_price_so",
                });
            }
        }

        const getDataSublistResult = (request) => {
            let sublistId = "custpage_sl_result";
            let lc = request.getLineCount(sublistId);

            let arrResult = [];
            for(let i = 0; i < lc; i++) {
                let obj = {
                    internalid: request.getSublistValue(sublistId, "custpage_col_0", i),
                    tranid: request.getSublistValue(sublistId, "custpage_col_1", i),
                    trandate: request.getSublistValue(sublistId, "custpage_col_3", i),
                };
                arrResult.push(obj);
            }
            return arrResult;
        }

        const getDataSalesOrder = () => {
            let data = searchSO.getDataSource();
            return data;
        }

        const onRenderData = (sublist, data) => {
            for (let i = 0; i < data.length; i++) {
                let obj = data[i];
                setRowDataSublist(sublist, i, [
                    "custpage_col_0", "custpage_col_1", "custpage_col_2", "custpage_col_3"
                ], [
                    obj.internalid, obj.tranid, obj.subsidiary_display, obj.trandate
                ]);
            }
        }

        const onCreateFormUI = (params, myCache) => {
            let mainForm = serverWidget.createForm({title: "Update giá hàng loạt nhiều SO"});
            // add button
            mainForm.addSubmitButton({label : 'Submit'});
            lbf.pinHeaderSublist(mainForm);
            // update status
            let mrTaskId = params.mrTaskId;

            if (lbf.isContainValue(mrTaskId) == false) {
                mrTaskId = myCache.get({
                    key: 'mrTaskId',
                    loader: 'loader'
                });
            }
            if (lbf.isContainValue(mrTaskId)) {
                let taskStatus = task.checkStatus(mrTaskId);
                let messageInfo = 'Status of Update Approve Status is: ' + taskStatus.status;
                mainForm.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    message: messageInfo,
                    duration: -1
                });
                if(taskStatus.status == 'COMPLETE') {
                    myCache.remove({ key: 'mrTaskId' });
                }
            }
            // add sublist
            let rsSL = mainForm.addSublist({
                id: "custpage_sl_result",
                type: serverWidget.SublistType.LIST,
                label: 'Result'
            });
            onCreateSublistColumn(rsSL);

            return { form: mainForm, sublist: rsSL }
        }

        function onCreateSublistColumn(sublist){
            let arrColumn = [
                { label: "Internal ID", type: "text" },
                { label: "Document Number", type: "text" },
                { label: "Subsidiary", type: "text" },
                { label: "Date", type: "text" },
                // { label: "Order Type", type: "text" },
                // { label: "Name", type: "text" },
            ];
            for(let i = 0; i< arrColumn.length; i++){
                let field = sublist.addField({
                    id: arrColumn[i].id || ("custpage_col_"+ i),
                    type: arrColumn[i].type,
                    label: arrColumn[i].label,
                });
                
                field.updateDisplayType({ displayType: arrColumn[i].displayType || "inline"});
            }
        }

        function setRowDataSublist(_sublist, _line, _field, _data){
            for(let i = 0; i<_field.length; i++){
                addValueColField(_sublist, _field[i], _line, _data[i]);
            }
        }

        function addValueColField(sublist, id, line, value) {
            if(lbf.isContainValue(value)){
                sublist.setSublistValue({
                    id: id,
                    line: line,
                    value: value
                });
            }
        }

        return {onRequest}

    });
