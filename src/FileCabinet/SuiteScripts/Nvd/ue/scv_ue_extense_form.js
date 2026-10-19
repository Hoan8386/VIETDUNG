/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  01 Nov 2024         Huy Pham			    Init, create file. Move From Aeon, from mr.Bính(skype)
 */
/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/search", "N/runtime"],

    (search, runtime) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
            let step_log = "";
            try{
                let curUser = runtime.getCurrentUser();

                let recType = scriptContext.newRecord.type;

                let objSetupExtenseForm = getDataSetupExtenseForm(recType);
                if(!objSetupExtenseForm) return;

                /* step_log = "addToggleCollapseExpandGroup";
                addToggleCollapseExpandGroup(scriptContext, objSetupExtenseForm); */
                
                if(curUser.roleId != "administrator"){
                    step_log = "hideColumnStandartSublist";
                    hideColumnStandartSublist(scriptContext, objSetupExtenseForm);

                    step_log = "hideAddLineSublist";
                    hideAddLineSublist(scriptContext, objSetupExtenseForm);
                }

                step_log = "addPinnedHeaderSubist";
                addPinnedHeaderSubist(scriptContext, objSetupExtenseForm);

                step_log = "addNoWrapSubist";
                addNoWrapSubist(scriptContext, objSetupExtenseForm);

                step_log = "addWidthColumnSublist";
                addWidthColumnSublist(scriptContext, objSetupExtenseForm);

                step_log = "addTooltipButton";
                addTooltipButton(scriptContext, objSetupExtenseForm);
            }
            catch(err){
                log.error("ERROR: TRY-CATCH: " + scriptContext.newRecord.type + " - " + step_log, err);
            }
            
        };

        const addPinnedHeaderSubist = (scriptContext, _objSetupExtenseForm) =>{
            // if(scriptContext.type != 'view') return;
            if(!_objSetupExtenseForm.custrecord_scv_ext_pinheadersublist) return;
            scriptContext.form.addField({
                id: 'custpage_scv_extense_pinheadersublist',
                label: 'Hidden',
                type: "inlinehtml"
            }).defaultValue = `<script>
                (function($) {
                    $(function() {
                        const tableContainer = $("div.uir-machine-table-container");
                        
                        tableContainer.css({"max-height": "70vh", "overflow-y": "auto"});
                        tableContainer.bind("scroll", function(event) {
                            $(event.target).find(".uir-machine-headerrow > td").css({
                                "transform": "translate(0, " + event.target.scrollTop + "px)",
                                "z-index": 1,
                                "position": "relative"
                            });
                        })
                        .bind("scroll", function(event) {
                            $(".machineButtonRow > table").css("transform", "translate(" + event.target.scrollLeft + "px)");
                        }); 
                    });
                })(jQuery);
            </script>`;
        }
        
        const hideColumnStandartSublist = (scriptContext, _objSetupExtenseForm) =>{
            if(scriptContext.type != "view") return;

            if(!_objSetupExtenseForm.custrecord_scv_ext_sublist_hidecolst) return;

            let str_setupConfig = _objSetupExtenseForm.custrecord_scv_ext_sublist_hidecolst.toString();
            str_setupConfig = str_setupConfig.replaceAll("<br>", ",");
            str_setupConfig = str_setupConfig.replaceAll("<br/>", ",");
            str_setupConfig = str_setupConfig.replaceAll("<br />", ",");
            str_setupConfig = str_setupConfig.replaceAll("\n", ",");
            str_setupConfig = str_setupConfig.replaceAll("\r", ",");
            str_setupConfig = str_setupConfig.replaceAll(" ", "");

            let arrSublistId = str_setupConfig.split(",");
            arrSublistId = arrSublistId.filter(_id => !!_id);

            let objResSublist = {
                sublistId: arrSublistId
            };

            scriptContext.form.addField({
                id : "custpage_scv_html_hide_colsublist",
                type : "inlinehtml",
                label : "Hide Column"
            }).defaultValue = `<script>
                let objResSublist = ${JSON.stringify(objResSublist)};
                let arrSublistId = objResSublist.sublistId;

                for(let i = 0; i < arrSublistId.length; i++){
                    hideColumnSublist(arrSublistId[i]);
                }

                function hideColumnSublist(_sublistId){
                    let tabSublistbody = jQuery("#" + _sublistId + "__tab tbody");
                    
                    if(!tabSublistbody || tabSublistbody.length == 0){
                        setTimeout(function(){ hideColumnSublist(_sublistId); }, 100);
                        return;
                    }

                    //solution case refresh line
                    if(tabSublistbody[0].getAttribute("data-scv-custom-hide-column") == "T"){
                        setTimeout(function(){ hideColumnSublist(_sublistId); }, 100);
                        return;
                    }

                    let idxColumnEdit = getIndexColumnByLabel_Hide(_sublistId, "Edit");
                    let idxColumnRemove = getIndexColumnByLabel_Hide(_sublistId, "Remove");
                    
                    let lstLine = jQuery("#" + _sublistId + "__tab tr");
                    
                    for(let i = 0; i < lstLine.length; i++){

                        try{
                            if(idxColumnRemove > -1){
                                lstLine[i].querySelectorAll("td")[idxColumnRemove].hidden = true;
                            }

                            if(idxColumnEdit > -1){
                                lstLine[i].querySelectorAll("td")[idxColumnEdit].hidden = true;
                            }
                        }catch(err){
                        
                        }
                        
                    }
                    tabSublistbody[0].setAttribute("data-scv-custom-hide-column", "T");

                    hideColumnSublist(_sublistId);
                }

                function getIndexColumnByLabel_Hide(_sublistId, _label){
                    let lstColumnHeader = jQuery("#" + _sublistId + "__tab thead tr td") 
                    for(let i = 0; i < lstColumnHeader.length; i++){
                        if(lstColumnHeader[i]?.getAttribute("data-nsps-label") == _label){
                            return i;
                            break;
                        }
                    }
                    return -1;
                }
                </script>`;
        }

        const hideAddLineSublist = (scriptContext, _objSetupExtenseForm) =>{
            if(!["create", "edit"].includes(scriptContext.type)) return;

            if(!_objSetupExtenseForm.custrecord_scv_ext_sublist_hideaddline) return;

            let str_setupConfig = _objSetupExtenseForm.custrecord_scv_ext_sublist_hideaddline.toString();
            str_setupConfig = str_setupConfig.replaceAll("<br>", ",");
            str_setupConfig = str_setupConfig.replaceAll("<br/>", ",");
            str_setupConfig = str_setupConfig.replaceAll("<br />", ",");
            str_setupConfig = str_setupConfig.replaceAll("\n", ",");
            str_setupConfig = str_setupConfig.replaceAll("\r", ",");
            str_setupConfig = str_setupConfig.replaceAll(" ", "");

            let arrSublistId = str_setupConfig.split(",");
            arrSublistId = arrSublistId.filter(_id => !!_id);

            let str_script = "";

            for(let i = 0; i < arrSublistId.length; i++){
                let sublistId = arrSublistId[i];
                let sublist_machine = sublistId + "_machine";

                str_script += `jQuery("#tbl_${sublistId}_addmultiple").hide(); `;
                str_script += `jQuery("#${sublistId}_buttons .uir-insert").css({"display": "none"}); `;
                str_script += `jQuery("#${sublistId}_buttons .uir-copy").css({"display": "none"}); `;
                str_script += `jQuery("#${sublistId}_copy").css({"display": "none"}); `;
                str_script += `${sublist_machine}.allow_insert = false; `;
                str_script += `${sublist_machine}.refresheditmachine(); `;
            }
            
            scriptContext.form.addField({
                id : "custpage_scv_html_hide_addlinesublist",
                type : "inlinehtml",
                label : "Hide Add Line Sublist"
            }).defaultValue = `<script>
                hideAddLineSublist();

                function hideAddLineSublist(){
                    if(NS.form.isInited()){
                        eval('${str_script}');
                    }
                    else{
                        setTimeout(function(){ hideAddLineSublist(); }, 100);
                    }
                }
            </script>`;
        }

        const addNoWrapSubist = (scriptContext, _objSetupExtenseForm) =>{
            let str_styleNoWrap = "";
            if(!!_objSetupExtenseForm.custrecord_scv_ext_nowrap_headersublist){
                str_styleNoWrap += ".uir-machine-headerrow{white-space: nowrap;} ";
            }
            if(!!_objSetupExtenseForm.custrecord_scv_ext_nowrap_linesublist){
                str_styleNoWrap += ".uir-machine-row, .uir-list-row-tr{white-space: nowrap;} ";
            }
            
            if(!str_styleNoWrap) return;

            scriptContext.form.addField({
                id: 'custpage_scv_extense_nowrapsublist',
                label: 'Hidden',
                type: "inlinehtml"
            }).defaultValue = `<style>${str_styleNoWrap}</style>`;
        }

        const addWidthColumnSublist = (scriptContext, _objSetupExtenseForm) =>{
            if(!_objSetupExtenseForm.custrecord_scv_ext_sublist_widthcol) return;

            let str_setupConfig = _objSetupExtenseForm.custrecord_scv_ext_sublist_widthcol.toString();
            str_setupConfig = str_setupConfig.replaceAll("<br>", "");
            str_setupConfig = str_setupConfig.replaceAll("<br/>", "");
            str_setupConfig = str_setupConfig.replaceAll("<br />", "");
            str_setupConfig = str_setupConfig.replaceAll("\n", "");
            str_setupConfig = str_setupConfig.replaceAll("\r", "");

            let arrColumnSublist = [];

            /**
             * Format: [{sublistId}]:[Label Column 1] = [Width 1],[Label Column 2] = [Width 2],...;
             * Ex:
             * {item}:Item=250,Units=150,Budget Code=200; {recmachcustrecord_scv_app_cost_d_approval}:item=250
             */
            let arrSublistGroup = str_setupConfig.split(";");
            for(let i = 0; i < arrSublistGroup.length; i++){
                let infoSublistGroup = arrSublistGroup[i].trim();

                if(!infoSublistGroup) continue;

                let arrDetailOfSublist = infoSublistGroup.split(":");
                if(arrDetailOfSublist.length != 2) continue;

                let sublistId = arrDetailOfSublist[0].replaceAll("{", "").replaceAll("}", "").trim();
                if(!sublistId) continue;

                let arrWidthColumn = arrDetailOfSublist[1].split(",");
                for(let j = 0; j < arrWidthColumn.length; j++){
                    let column_width = arrWidthColumn[j].trim();
                    if(!column_width) continue;

                    let arrDetailColumnWidth = column_width.split("=");
                    if(arrDetailColumnWidth.length != 2) continue;

                    let fieldLabel = arrDetailColumnWidth[0].trim();
                    let fieldWidth = arrDetailColumnWidth[1].trim();

                    arrColumnSublist.push({sublistId: sublistId, label: fieldLabel, width: fieldWidth});
                }
            }
            if(arrColumnSublist.length == 0) return;

            let str_styleWitdhCol = ``;
            for(let i = 0; i < arrColumnSublist.length; i++){
                let objColumn = arrColumnSublist[i];

                str_styleWitdhCol += `
                #${objColumn.sublistId}_splits td[data-nsps-label= "${objColumn.label}" i] .listheader{width: ${objColumn.width}px;} 
                #${objColumn.sublistId}__tab td[data-nsps-label= "${objColumn.label}" i] .listheader{width: ${objColumn.width}px;} 
                `;
            }

            str_styleWitdhCol = minifyCSS("<style>" + str_styleWitdhCol + "</style>");
            
            scriptContext.form.addField({
                id: 'custpage_scv_extense_widthcolsublist',
                label: 'Hidden',
                type: "inlinehtml"
            }).defaultValue = str_styleWitdhCol;
        }

        const addTooltipButton = (scriptContext, _objSetupExtenseForm) =>{
            if(!_objSetupExtenseForm.custrecord_scv_ext_btn_tooltip) return;

            let str_setupConfig = _objSetupExtenseForm.custrecord_scv_ext_btn_tooltip.toString();

            const REGEX_BUTTON_ID = /[^{\}]+(?=})/g;
            let arrButtonId = str_setupConfig.match(REGEX_BUTTON_ID)||[];
            let arrInfoButton = [];

            for(let i = 0; i < arrButtonId.length; i++){
                let buttonId = arrButtonId[i];
                if(!buttonId) continue;

                let idxStartInfo = str_setupConfig.indexOf(`{${buttonId}}`);
                let idxEndInfo = idxStartInfo + buttonId.length + 2;
                if(arrButtonId.length > (i + 1)){
                    idxEndInfo = str_setupConfig.indexOf(`{${arrButtonId[i + 1]}}`);
                }
                else{
                    idxEndInfo = str_setupConfig.length;
                }

                let infoBtnTooltip = str_setupConfig.substring(idxStartInfo, idxEndInfo);
                
                let tooltip = infoBtnTooltip.substring(infoBtnTooltip.indexOf(":") + 1)?.trim();
                if(!tooltip) continue;

                arrInfoButton.push({
                    id: buttonId,
                    tooltip: tooltip
                });
            }

            if(arrInfoButton.length == 0) return;

            scriptContext.form.addField({
                id : "custpage_scv_extense_btntooltip",
                type : "inlinehtml",
                label : "Hidden"
            }).defaultValue = `<script>
                let arrInfoButton = `+JSON.stringify(arrInfoButton)+`;
                for (let objInfoBtn of arrInfoButton) {
                    addToolTipButton_ScvExtForm(objInfoBtn.id, objInfoBtn.tooltip);
                    addToolTipButton_ScvExtForm("secondary" + objInfoBtn.id, objInfoBtn.tooltip)
                }

                function addToolTipButton_ScvExtForm(_btnId, _tooltip){
                    let eleButton = document.getElementById(_btnId);
                    if(!!eleButton){
                        eleButton.setAttribute("data-ns-tooltip", _tooltip||eleButton.value);
                    }
                    else {
                        setTimeout(function(){
                            addToolTipButton_ScvExtForm(_btnId, _tooltip);
                        }, 500);
                    }
                }
            </script>`;
        }

        const getDataSetupExtenseForm = (_recType) => {
            if(!_recType) return null;

            let resultSearch = search.create({
                type: "customrecord_scv_extense",
                filters: [
                    ['custrecord_scv_ext_rectype', 'is', _recType],
                    "AND",
                    ["isinactive", "is", "F"]
                ],
                columns: [
                    "custrecord_scv_ext_pinheadersublist", "custrecord_scv_ext_sublist_hidecolst", "custrecord_scv_ext_sublist_hideaddline",
                    "custrecord_scv_ext_nowrap_headersublist", "custrecord_scv_ext_nowrap_linesublist", "custrecord_scv_ext_sublist_widthcol",
                    "custrecord_scv_ext_btn_tooltip"
                ]
            });
            let myColumns = resultSearch.columns;
            resultSearch = resultSearch.run().getRange(0, 1);

            let objRes = null;
            if(resultSearch.length > 0){
                objRes = {
                    id: resultSearch[0].id,
                    custrecord_scv_ext_pinheadersublist: resultSearch[0].getValue(myColumns[0]),
                    custrecord_scv_ext_sublist_hidecolst: resultSearch[0].getValue(myColumns[1]),
                    custrecord_scv_ext_sublist_hideaddline: resultSearch[0].getValue(myColumns[2]),
                    custrecord_scv_ext_nowrap_headersublist: resultSearch[0].getValue(myColumns[3]),
                    custrecord_scv_ext_nowrap_linesublist: resultSearch[0].getValue(myColumns[4]),
                    custrecord_scv_ext_sublist_widthcol: resultSearch[0].getValue(myColumns[5]),
                    custrecord_scv_ext_btn_tooltip: resultSearch[0].getValue(myColumns[6]),
                }
            }
            return objRes;
        }

        const minifyCSS = (css) => {
            // Xóa chú thích CSS
            css = css.replace(/\/\*[\s\S]*?\*\//g, '');
            
            // Xóa khoảng trắng không cần thiết
            css = css.replace(/\s*([{}:;,])\s*/g, '$1');
            
            // Xóa xuống dòng, tab
            css = css.replace(/\s\s+/g, ' ');
            
            // Xóa khoảng trắng ở đầu và cuối
            css = css.trim();
            
            return css;
        }

        return {beforeLoad}

    });
