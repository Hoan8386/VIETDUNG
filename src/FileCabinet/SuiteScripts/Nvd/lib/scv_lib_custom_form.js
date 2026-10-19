
define([
        'N/runtime', 'N/record', 'N/search',
        '../lib/scv_lib_function.js'],
    (runtime, record, search, lbf) => {
        
        const PRIMARY_COLOR = "#000000";
        const PRIMARY_BG = "#D9E2F2";
        const FONT_SIZE = "12px";
        const TITLE_COLOR = '#002060'
        // const FONT_FAMILY = "'Times New Roman', Times, serif";
        
        const addFieldDxGridResult = (form, elemnetId) => {
            let resultGrp = addFieldGroup(form, "resultgrp_main", "Kết quả");
            let custpage_grid_result = form.addField({
                id: 'custpage_grid_result',
                type: "inlinehtml",
                label: 'Result',
                container: resultGrp.id
            });
            custpage_grid_result.defaultValue = `<div style="margin-top: 8px;" id="${elemnetId}"></div>`;
        }
        
        const addFieldScriptData = (form, data) => {
            let custpage_script_data = form.addField({
                id: 'custpage_script_data',
                type: "inlinehtml",
                label: 'Script Data',
            });
            
            custpage_script_data.defaultValue = `<script>
			let objProjectData = ${JSON.stringify(data)};
		</script>`;
        }
        
        const addFieldIncludeDxGrid = (form, arrChiTieu) => {
            let custpage_include_dxgrid = form.addField({
                id: 'custpage_include_dxgrid',
                type: "inlinehtml",
                label: 'Include DxGrid',
            });
            custpage_include_dxgrid.defaultValue = includeHtmlCustomDxGrid(arrChiTieu);
        }
        
        const renderDxGridResult = (data, columns, elemnetId) => {
            resizeGrid(elemnetId);
            let optionGrid = getOptionGrid();
            optionGrid.dataSource.store = data;
            optionGrid.columns = columns;
            
            $('#' + elemnetId).dxDataGrid(optionGrid);
        }
        
        const getOptionGrid = () => {
            return {
                dataSource: {
                    store: [],
                    reshapeOnPush: true,
                },
                columns: [],
                columnResizingMode: "widget",
                showBorders: true,
                showColumnLines: true,
                showRowLines: true,
                allowColumnResizing: true,
                columnAutoWidth: true,
                repaintChangesOnly: true,
                wordWrapEnabled: true,
                // selection: "single",
                searchPanel: {visible: true},
                rowAlternationEnabled: false,
                paging: {pageSize: 500},
                loadPanel: {enabled: false},
                columnFixing: {enabled: true},
                pager: {
                    showPageSizeSelector: true,
                    allowedPageSizes: [100, 200, 500, 1000],
                    showPageSizeSelector: true,
                    showInfo: true,
                    showNavigationButtons: true,
                },
                onCellPrepared: function (e) {
                    createFontReport(e.cellElement);
                    if (e.rowType == "data" && e.column.allowEditing == true) {
                        if (e.row.data?.level == 1) {
                            e.cellElement.css("font-weight", "bold");
                        }
                    }
                }
            };
        }
        
        const addFieldGroup = (form, id, label) => {
            let obj = {id: id, label: label}
            form.addFieldGroup(obj);
            return obj;
        }
        
        const getFromDate = (fromdt) => {
            if (lbf.isContainValue(fromdt)) {
                return fromdt;
            }
            let d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), "01");
        }
        
        const getToDate = (todt) => {
            if (lbf.isContainValue(todt)) {
                return todt;
            }
            let d = new Date();
            return new Date(d.getFullYear(), d.getMonth() + 1, 0);
        }
        
        const onLoadSubsidiaryRole = (subsidiaryField) => {
            let data = getDataSubsidiaryByRole();
            subsidiaryField.addSelectOption({value: "", text: ""});
            
            for (let i in data) {
                subsidiaryField.addSelectOption({
                    value: data[i].id,
                    text: data[i].name
                });
            }
        }
        
        const getDataSubsidiaryByRole = () => {
            let curUser = runtime.getCurrentUser();
            let roleRec = record.load({type: "role", id: curUser.role});
            let subsidiary_op = roleRec.getValue("subsidiaryoption");
            let myFilter = [];
            switch (subsidiary_op) {
                case 'ALL':
                    myFilter = [];
                    break;
                case 'ALLACTIVE':
                    myFilter = [['isinactive', 'is', false]];
                    break;
                case 'OWN':
                    let entityLKF = search.lookupFields({type: "entity", id: curUser.id, columns: "subsidiary"});
                    let sub_id = "";
                    if (!!entityLKF.subsidiary) {
                        if (entityLKF.subsidiary.length > 0) {
                            sub_id = entityLKF.subsidiary[0].value;
                        }
                    }
                    
                    myFilter = ['internalid', "anyOf", sub_id];
                    break;
                case 'SELECTED':
                    let arrSubSel = roleRec.getValue("subsidiaryrestriction");
                    myFilter = ['internalid', "anyOf", arrSubSel]
                    break;
            }
            let subSearch = search.create({
                type: "subsidiary",
                filters: myFilter,
                columns: ["namenohierarchy"]
            });
            subSearch = subSearch.run().getRange(0, 1000);
            
            let arrResult = [];
            for (let i in subSearch) {
                arrResult.push({
                    id: subSearch[i].id,
                    name: subSearch[i].getValue('namenohierarchy')
                })
            }
            
            return arrResult;
        }
        
        const includeHtmlCustomDxGrid = (arrChiTieu) => {
            let htmlDxGrid = `${includeLibaryExternalHtml()}`;
            if (Array.isArray(arrChiTieu)) {
                htmlDxGrid += `<script>
				let arrChiTieu = ${JSON.stringify(arrChiTieu)};
			</script>`
            }
            htmlDxGrid += `${includeCustomCssForm()}`;
            htmlDxGrid += `${includeTagStyleHtml()}`;
            return htmlDxGrid;
        }
        
        const loadLocalSearchInfo = (curRec) => {
            let objSearchInfo = getLocalSearchInfo();
            if (Object.keys(objSearchInfo).length > 0) {
                curRec.setValue("custpage_subsidiary", objSearchInfo.custpage_subsidiary);
                curRec.setValue("custpage_project", objSearchInfo.custpage_project);
            }
        }
        
        const setLocalSearchInfo = (curRec) => {
            let jsonData = JSON.stringify({
                custpage_subsidiary: curRec.getValue("custpage_subsidiary"),
                custpage_project: curRec.getValue("custpage_project")
            });
            localStorage.setItem("scvDefaultSearchInfo", jsonData);
        }
        
        const createTagLink = (link, name) => {
            return `<span>
            <a style="color: ${PRIMARY_COLOR}; text-decoration: underline;" href="${link}" target="_blank">${name}</a>    
        </span>`;
        }
        
        const createFontReport = (element) => {
            // element.css("font-size", FONT_SIZE);
            // element.css("font-family", FONT_FAMILY);
            // element.css("color", PRIMARY_COLOR);
        }
        
        const includeLibaryExternalHtml = () => {
            return `
			<script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.min.js"></script>

			<link rel="stylesheet" href="https://cdn3.devexpress.com/jslib/21.2.15/css/dx.light.css" />
			<script type="text/javascript" src="https://cdn3.devexpress.com/jslib/21.2.15/js/dx.all.js"></script>

			<script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.2.1/exceljs.min.js"></script>
			<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
		`;
        }
        
        const includeTagStyleHtml = () => {
            return `
		<style>
			.card {
				min-height: 35rem;
			}
	
			.dx-header-row {
				background-color: ${PRIMARY_BG} !important;
				vertical-align: bottom;
				color: ${PRIMARY_COLOR} !important;
				/*font-size: ${FONT_SIZE} !important;*/
				text-align: center!important;
				font-weight: bold !important;
			}
	
			td[role=columnheader] {
				text-align: center!important
			}
	
			.dx-datagrid-headers {
				position: sticky;
				top: 0px;
				background-color: white;
				z-index: 1000;
			}
			.dx-datagrid-headers .dx-datagrid-table .dx-row > td{
				border-bottom-width: 1px !important;
				border-bottom-style: solid !important;
				border-bottom-color: black !important;
	
				border-left-width: 1px !important;
				border-left-style: solid !important;
				border-left-color: black !important;
	
				border-right-width: 1px !important;
				border-right-style: solid !important;
				border-right-color: black !important;
	
				border-top-width: 1px !important;
				border-top-style: solid !important;
				border-top-color: black !important;
	
				border-width: 1px !important;
				border-style: solid !important;
				border-color: black !important;
			}
	
			.dx-data-row{
				
			}
			.dx-item-content.dx-tab-content {
				color: ${PRIMARY_COLOR} !important;
				font-weight: bold;
				/*font-size: ${FONT_SIZE} !important;*/
			}
			.dx-datagrid-action.dx-cell-focus-disabled, .dx-placeholder {
				// font-size: ${FONT_SIZE} !important;
			}

			.dx-page-size, .dx-info, .dx-page {
				// font-size: ${FONT_SIZE} !important;
				/*color: ${PRIMARY_COLOR} !important;*/
			}

			.dx-cell-focus-disabled {
				
			}
			
			.dx-tabpanel > .dx-tabpanel-tabs .dx-tab {
				 border: 1px solid #E5E5E5;
			}
			.dx-row.dx-freespace-row.dx-column-lines {
				height: 0px !important;
			}
			.dx-searchbox .dx-texteditor-input {
				padding-left: 34px !important;
			}
		</style>
		`;
        }
        
        const includeCustomCssForm = () => {
            return `
			<style>
				.uir-button .pgBntG .bntBgB input[type=button] {
					color: ${PRIMARY_COLOR} !important;
				}
				.uir-button .pgBntG .bntBgB input[type=submit] {
				}
				.uir-button .pgBntB .bntBgB input[type=button] {
					color: #fff !important;
				}
				.pgBntY_sel *, .pgBntG_sel *, .pgBntGDis_sel *,
				.pgBntG, .pgBntG_sel,
				.fgroup_title.uir-field-group-title,
				.uir-record-type,
				.uir-label, .uir-input-text, .ns-menuitem a,
				.uir-popup-cal-nav-title, .uir-popup-cal-header-row > td, 
				.uir-popup-cal-cell-text, .uir-popup-cal-cell-text-light, .uir-popup-cal-cell,
				.dropdownInput, .dropdownNotSelected, .dropdownSelected {
					color: ${PRIMARY_COLOR} !important;
				}
				.uir-page-title-firstline.uir-page-title-firstline-record h1{
                    color: ${TITLE_COLOR} !important;
				}
				.fgroup_title.uir-field-group-title {
					font-size: ${FONT_SIZE} !important;
				}
				.dropdownDiv .dropdownSelected, 
				td.uir-popup-cal-cell-selected a,
				td.fgroup_title {
					background-color: ${PRIMARY_BG} !important;
				}
				.page-title-menu {
					display: none;
				}
			</style>
		`;
        }
        
        const getLocalSearchInfo = () => {
            let localSearchInfo = localStorage.getItem("scvDefaultSearchInfo");
            if (!localSearchInfo) return {};
            
            return JSON.parse(localSearchInfo);
        }
        
        function formatProjectName(project_nm) {
            if (!project_nm) return "";
            
            let maxLength = 50;
            let suffix = "...";
            
            if (project_nm.length <= maxLength) return project_nm;
            
            let partLength = Math.floor((maxLength - suffix.length) / 2);
            
            let start = project_nm.substring(0, partLength);
            let lastSpaceStart = start.lastIndexOf(" ");
            if (lastSpaceStart !== -1) {
                start = start.substring(0, lastSpaceStart);
            }
            
            let end = project_nm.substring(project_nm.length - partLength);
            let firstSpaceEnd = end.indexOf(" ");
            if (firstSpaceEnd !== -1) {
                end = end.substring(firstSpaceEnd + 1);
            }
            
            return `${start}${suffix}${end}`;
        }
        
        function resizeGrid(_gridId) {
            var windowWidth = window.innerWidth;
            $('#' + _gridId).css("width", (windowWidth - 70) + "px");
            $('#' + _gridId).css("max-width", (windowWidth - 70) + "px");
            setTimeout(function () {
                resizeGrid(_gridId)
            }, 100);
        }
        
        const formatNumber = (_num, _fixed = 2) => {
            if (typeof _num === 'number' && _num % 1 !== 0) {
                _num = _num.toFixed(_fixed);
            }
            var parts = _num.toString().split(".");
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return parts.join(".");
        }
        
        return {
            addFieldGroup,
            getFromDate,
            getToDate,
            onLoadSubsidiaryRole,
            addFieldIncludeDxGrid,
            addFieldDxGridResult,
            addFieldScriptData,
            includeHtmlCustomDxGrid,
            renderDxGridResult,
            getOptionGrid,
            loadLocalSearchInfo,
            setLocalSearchInfo,
            createFontReport,
            createTagLink,
            formatProjectName,
            resizeGrid,
            formatNumber
        };
    });

