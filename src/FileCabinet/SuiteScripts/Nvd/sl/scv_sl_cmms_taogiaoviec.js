/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/cache', 'N/runtime', 'N/ui/serverWidget', 'N/task',
        '../lib/scv_lib_report.js'],
    
    (cache, runtime, serverWidget, task, libRep) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request =  scriptContext.request;
            let response = scriptContext.response;
            
            let parameters = request.parameters;
            let subsidiary = runtime.getCurrentUser().subsidiary;
            
            let myCache = cache.getCache({
                name: 'createWorkOrderFromMainTenancePlan',
                scope: cache.Scope.PUBLIC
            });
            let mrTaskId = parameters.mrTaskId;
            if(!mrTaskId) {
                mrTaskId = myCache.get({key: 'mrTaskId', loader: 'loader'});
            }
            
            let messageInfo = '';
            let isComplete = true;
            if(mrTaskId) {
                let taskStatus = task.checkStatus(mrTaskId);
                messageInfo = 'Tạo giao việc: ' + taskStatus.status
                if(taskStatus.status === 'COMPLETE' || taskStatus.status === 'FAILED') {
                    myCache.remove({key: 'mrTaskId'});
                } else {
                    isComplete = false;
                }
            }
            
            if(request.method === 'GET') {
                let form = serverWidget.createForm({title: "Tạo giao việc", hideNavBar: true});
                libRep.addFieldHidden(form, 'custpage_maintenanceplan', parameters.custpage_maintenanceplan);
                let fieldTextConfirm = form.addField({id: 'custpage_textconfirm', label: ' ', type: serverWidget.FieldType.INLINEHTML});
                if(isComplete) {
                    fieldTextConfirm.defaultValue = 'Bạn có muốn tạo giao việc không?';
                    form.addSubmitButton({label: 'Tạo giao việc'});
                } else {
                    fieldTextConfirm.defaultValue = messageInfo;
                }
                response.writePage(form);
            } else {
                let maintenancePlan = {
                    subsidiary: subsidiary,
                    maintenanceplan_id: parameters.custpage_maintenanceplan
                };
                
                try {
                    let mrTask = task.create({taskType: task.TaskType.MAP_REDUCE,
                        scriptId : 'customscript_scv_mr_cmms_create_workorde',
                        deploymentId : 'customdeploy_scv_mr_cmms_create_workorde'
                    });
                    mrTask.params = {custscript_scv_mr_cmms_maintenanceplan: JSON.stringify(maintenancePlan)};
                    mrTaskId = mrTask.submit();
                    myCache.put({key: 'mrTaskId', value: mrTaskId});
                } catch (e) {
                    log.error('exception create task', e);
                }
                
                writeCompleteWorkOrder(response);
            }
        }
        
        const writeCompleteWorkOrder = (response) => {
            response.write(`
                Tạo giao việc thành công!
            `);
        }

        return {onRequest}
        
    });
