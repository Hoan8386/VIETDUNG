define(['N/record', 'N/search', 'N/file',
	'../cons/scv_cons_format.js'
],
	
	(record, search, file, constFormat) => {
		
		const addIconButtonExport = (form, arrButton, fieldId) =>{
			if(arrButton.length === 0) return;
			let htmlField = form.addField({
				id: fieldId,
				label: "html",
				type: "INLINEHTML",
			});
			htmlField.defaultValue = getScriptAddIcon(arrButton);
		}
		
		const addClassBtnSubmit = (form, btnId) => {
			let htmlField = form.addField({
				id: 'custpage_add_classlist_' + onGenCodeRandom(),
				label: "html",
				type: "INLINEHTML",
			});
			htmlField.defaultValue = `<script>
				const btnSubmit = document.getElementById("tr_${btnId}");
				btnSubmit.classList.add('pgBntB');

				let btnSecondId = 'tr_secondary' + '${btnId}';
				addClassSubmitBtn(btnSecondId);

				function addClassSubmitBtn(buttonId) {
					const btnSecond = document.getElementById(buttonId);
					if(!btnSecond) {
						setTimeout(() => addClassSubmitBtn(buttonId), 500);
					} else {
						btnSecond.classList.add('pgBntB');
					}
				}
			</script>`;
		}

		const addFieldFuncLoading = (form) => {
			let htmlField = form.addField({
				id: 'custpage_add_func_loading',
				label: "html",
				type: "INLINEHTML",
			});

			const CSS_LOADING = `
			.scvLoader {
				width: 100px; height: 100px; 
				border: 8px solid #e0e0e0; 
				border-bottom-color: #0288d1;
				border-radius: 50%; display: inline-block; box-sizing: border-box; position: fixed;
				transform: translate(-50%, -50%); animation: scvRotationLoading 1s linear infinite;
			}
			.scvProgessStatus {
				position: fixed; top: 50%; left: 50%; font-size: 12px; transform: translate(-50%, -50%);
			}
			.scvMainLoader {
				position: fixed; top: 0; left: 0; height: 100%; width: 100%; z-index: 9999;
				display: flex; justify-content:center; align-items:center; 
				flex-direction: column; background-color: rgba(255, 255, 255, 0.85);
			}
			@keyframes scvRotationLoading {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}`;

			htmlField.defaultValue = `<script>
				function scvShowLoadingUE(isShow) {
					let progessElement = "";
					if(isShow) {
						let container = document.getElementById("pageContainer") || document.getElementById("outerwrapper");
						if(!container) return console.error("Not found ElementId");

						loadStyleToHtmlPageUE(container);
						let mainLoader = document.createElement('div');
						mainLoader.classList.add("scvMainLoader");
						mainLoader.innerHTML = '<span class="scvLoader"></span><span id="idxProgessStatus" class="scvProgessStatus">Processing...</span>';
						
						container.appendChild(mainLoader);
						progessElement = document.querySelector(".scvProgessStatus");
					} else {
						let mainLoader = document.querySelector(".scvMainLoader");
						if(mainLoader) mainLoader.remove();
					}
					return progessElement;
				}

				function loadStyleToHtmlPageUE(container) {
					let addLoading = container.getAttribute("scv-add-loading");
					if(addLoading == "T") return;
					container.setAttribute("scv-add-loading", "T");

					let linkElement = document.createElement('style');
					let textNode = document.createTextNode(\`${CSS_LOADING}\`);
					linkElement.appendChild(textNode);
					document.head.appendChild(linkElement);
				}
			</script>`;
		}
		
		
		const getScriptAddIcon = (arrButton) => {
			// id, export_type
			let jsonData = JSON.stringify(arrButton);
			let render = '<script>\n';
					render += `
				const sprite_image = '/images/sprite-list.png';
				const scvListButton = JSON.parse('${jsonData}');

				scvListButton.forEach(({ id, export_type }) => {
					const buttonElement = document.getElementById(id);
					if (buttonElement) {
					   customAddIconBtn(buttonElement, export_type);
					   processItemIcon(id, export_type);
					}
				});

				function customAddIconBtn(buttonElement, iconType) {
					const buttonValue = buttonElement.value;
					setButtonStyle(buttonElement);
					setIconStyle(buttonElement, iconType);
					buttonElement.value = buttonValue;
						}
				function setButtonStyle(buttonElement) {
					buttonElement.style.setProperty('padding-left', '23px', 'important');
					buttonElement.style.setProperty('background', 'url('+ sprite_image +')', 'important');
					buttonElement.style.setProperty('background-repeat', 'no-repeat', 'important');
					buttonElement.style.setProperty('background-position-x', '-48px', 'important');
					buttonElement.style.setProperty('background-position-y', '-596px', 'important');
				}
				function setIconStyle(buttonElement, iconType) {
					switch (iconType) {
					  case 'PDF':
						buttonElement.style.setProperty('background-position-y', '-546px', 'important');
						break;
					  case 'EXCEL':
						buttonElement.style.setProperty('background-position-y', '-496px', 'important');
						break;
					  case 'WORD':
						buttonElement.style.setProperty('background-position-y', '-646px', 'important');
						break;
					  case 'SEARCH':
						buttonElement.style.setProperty('background-position-y', '-44px', 'important');
						buttonElement.style.setProperty('background-position-x', '-46px', 'important');
						break;
					}
				}
				function processItemIcon(buttonId, iconType) {
					const buttonElement = document.getElementById('secondary' + buttonId);
					if (!buttonElement) {
					  setTimeout(() => processItemIcon(buttonId, iconType), 500);
					} else {
					  customAddIconBtn(buttonElement, iconType);
			}
				}
			`;
			render += '</script>\n';
			return render;
		}
		
		const addFrameUploadFile = (_form, _curRec) =>{
			let htmlFile = file.load({id: '../html/scv_html_uploadfile.html'}).getContents();
			let custpage_html_file = _form.addField({
				id: 'custpage_html_file',
				type: "inlinehtml",
				label: 'HTML'
			});
			custpage_html_file.defaultValue = htmlFile;
		}
		
		const renderDxGrid = (_form, _optionGrid, _arrData, _pathFile) =>{
			let opGrid = _optionGrid||{};
			_pathFile = _pathFile || '../html/tmpl/scv_html_tmpl_grd00001.html';
			opGrid.columns = opGrid.columns || [];
			opGrid.summaryTotalItems = opGrid.summaryTotalItems || [];
			opGrid.summaryGroupItems = opGrid.summaryGroupItems || [];

			let localeId = constFormat.getLocaleByFormat();

			let htmlFile ="<script>" +
				"let opGrid = " + JSON.stringify(opGrid) + ";" +
				"let arrData = " + JSON.stringify(_arrData) + ";" +
				"let localeId ='" + localeId + "';" +
				"</script>";
			htmlFile += file.load({id: _pathFile}).getContents();

			let fieldGroup_id = "fieldgrp_" + onGenCodeRandom();
			_form.addFieldGroup({id: fieldGroup_id, label: "Result"});
			let custpage_dxgrid = _form.addField({
				id: 'custpage_dxgrid',
				type: "inlinehtml",
				label: 'DxGrid',
				container: fieldGroup_id
			});
			custpage_dxgrid.defaultValue = htmlFile;
		}
		
		const renderDxGridWithTab = (_form, _arrtab, _arrData) =>{
			let arrTab = _arrtab||{};
			for(let i = 0; i < arrTab.length; i++){
				arrTab[i].optionGrid.columns = arrTab[i].optionGrid.columns || [];
				arrTab[i].optionGrid.summaryTotalItems = arrTab[i].optionGrid.summaryTotalItems || [];
				arrTab[i].optionGrid.summaryGroupItems = arrTab[i].optionGrid.summaryGroupItems || [];
			}

			let htmlFile ="<script>" +
				"let arrTab = " + JSON.stringify(arrTab) + ";" +
				"</script>";
			htmlFile += file.load({id: '../html/tmpl/scv_html_tmpl_grd00002.html'}).getContents();

			let fieldGroup_id = "fieldgrp_" + onGenCodeRandom();
			_form.addFieldGroup({id: fieldGroup_id, label: "Result"});
			let custpage_dxgrid = _form.addField({
				id: 'custpage_dxgrid',
				type: "inlinehtml",
				label: 'DxGrid',
				container: fieldGroup_id
			});
			custpage_dxgrid.defaultValue = htmlFile;
		}
		const popupCenter = (url, title, w, h) =>{
			let dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
			let dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;
		
			let width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
			let height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
		
			let systemZoom = width / window.screen.availWidth;
			let left = (width - w) / 2 / systemZoom + dualScreenLeft
			let top = (height - h) / 2 / systemZoom + dualScreenTop
			window.open(url, title,"scrollbars=yes,resizable=no,width="+(w/systemZoom)+",height="+(h/systemZoom)+",top="+top+",left="+left);
		}
		const renderDxGridTreeList = (_form, _optionGrid, _arrData) => {
			let opGrid = _optionGrid||{};
			opGrid.columns = opGrid.columns || [];
			opGrid.expandedRowKeys = opGrid.expandedRowKeys || [];
			opGrid.summaryTotalItems = opGrid.summaryTotalItems || [];
			opGrid.summaryGroupItems = opGrid.summaryGroupItems || [];

			let htmlFile ="<script>" +
				"let opGrid = " + JSON.stringify(opGrid) + ";" +
				"let arrData = " + JSON.stringify(_arrData) + ";" +
				"</script>";
			htmlFile += file.load({id: '../html/tmpl/scv_html_tmpl_grd00003.html'}).getContents();

			let fieldGroup_id = "fieldgrp_" + onGenCodeRandom();
			_form.addFieldGroup({id: fieldGroup_id, label: "Result"});
			let custpage_dxgrid = _form.addField({
				id: 'custpage_dxgrid',
				type: "inlinehtml",
				label: 'DxGrid',
				container: fieldGroup_id
			});
			custpage_dxgrid.defaultValue = htmlFile;
		}
		
		const renderDxGridV2 = (_form, _optionGrid, _arrData) =>{
			let opGrid = _optionGrid||{};
			opGrid.columns = opGrid.columns || [];
			opGrid.summaryTotalItems = opGrid.summaryTotalItems || [];
			opGrid.summaryGroupItems = opGrid.summaryGroupItems || [];

			let htmlFile ="<script>" +
				"let opGrid = " + JSON.stringify(opGrid) + ";" +
				"let arrData = " + JSON.stringify(_arrData) + ";" +
				"</script>";
			htmlFile += file.load({id: '../html/tmpl/scv_html_tmpl_grd_00001_v1.html'}).getContents();

			let fieldGroup_id = "fieldgrp_" + onGenCodeRandom();
			_form.addFieldGroup({id: fieldGroup_id, label: opGrid?.reportTitle ||"Kết quả"});
			let custpage_dxgrid = _form.addField({
				id: 'custpage_dxgrid',
				type: "inlinehtml",
				label: 'DxGrid',
				container: fieldGroup_id
			});
			custpage_dxgrid.defaultValue = htmlFile;
		}
		
		const onGenCodeRandom = () =>{
			return "" + Math.round(Math.random()*1000) + ("" +Date.now());
		}

		/**
		 * Des: POPUP show multi select field
		 * @param form - form
		 * @param fieldId - string : Field ID
		 * @param dataSource - array data source
		 * @param pageSize - pageSize default 10
		 */
		const fnAddPopupFieldMultiSelect = (form, fieldId, dataSource, pageSize) => {
			let _PageSize = pageSize || 10;
			let htmlPopup = `
           <script type="text/javascript">
            document.addEventListener('DOMContentLoaded', function() {
                let _fieldId = '{{fieldId}}';
                const _action = '';
                let _urlPopup = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_popup_mutil_select&deploy=customdeploy_scv_sl_popup_mutil_select';
                let queryParams = '&action=' + _action + '&fieldId=' + _fieldId;
                window.SCV = window.SCV || {};
                const dataSource = JSON.parse(JSON.stringify(${JSON.stringify(dataSource)}));
                const propVal = 'data_' + _fieldId; 
                const propConfig = 'dataConfig_' + _fieldId;
                window.SCV[propVal] = dataSource;
                window.SCV[propConfig] = { PAGE_SIZE: +'${_PageSize}', FIELD_ID : _fieldId };
                const offsetWidth = window.document.getElementById('main_form').children[0].offsetWidth + 10;
                window.SCV['fn_'+_fieldId] = () => {window.nlExtOpenWindow(_urlPopup + queryParams, 'popUp_'+_fieldId,  683, 580, this, false, 'Choose items')};//offsetWidth / 2 + 100
                let htmlPopup = \`
                    <span class="uir-field-widget">
                        <a data-helperbuttontype="list" id="{{fieldId}}_popup_list" tabindex="-1"
                            class="smalltextul fwmultisel uir-field-widget" title="Select Multiple"
                            href="javascript:void('{{fieldId}}')"
                            onclick="window.SCV.fn_{{fieldId}}(this);return false;"
                            onfocus="if (this.className.indexOf('_focus') == -1) this.className = this.className + '_focus'; return true;"
                            onblur="this.className = this.className.replace('_focus', ''); return true;">
                            <span class="material-icons" style="font-size: 18px;">keyboard_double_arrow_up</span>
                        </a>
                    </span>
                \`.replaceAll('{{fieldId}}', _fieldId);
                // Add CSS
                let head = document.getElementsByTagName('head')[0];
                let style = document.createElement('link');
                style.rel = 'stylesheet';
                style.type = 'text/css';
                style.href = 'https://fonts.googleapis.com/icon?family=Material+Icons'; 
                head.appendChild(style);
                // Append HTML //custpage_scv_item_fs
                let tempElement = document.createElement('div');
                tempElement.innerHTML = htmlPopup.trim();
                let spanElement = tempElement.firstChild;
                // let inputElement = document.getElementById('hddn_' + _fieldId + '1');
                let inputElement = document.getElementById(_fieldId + '_fs');
                inputElement.parentNode.insertBefore(spanElement, inputElement.nextSibling);
            });
        </script>
        `;
			htmlPopup = htmlPopup.replaceAll('{{fieldId}}', fieldId);
			const randomId = +new Date();
			form.addField({
				id: "custpage_mulsl_" + randomId,
				label: "Multi Select",
				type: 'INLINEHTML',
			}).defaultValue = htmlPopup;
		}

		/**
		 * Des : POPUP show select field
		 * @param form
		 * @param fieldId - string : Field ID
		 * @param dataSource - array data source {id, name}
		 * @param pageSize - pageSize default 10
		 * @param namePopup - string
		 */
		const fnAddPopupFieldSelect = (form, fieldId, dataSource, pageSize, namePopup) => {
			let _PageSize = pageSize || 10;
			let _NamePopup = namePopup || 'Choose Item';
			let htmlPopup = `
           <script type="text/javascript">
            document.addEventListener('DOMContentLoaded', function() {
                let _fieldId = '{{fieldId}}';
                const _action = '';
                let _urlPopup = '/app/site/hosting/scriptlet.nl?script=customscript_scv_sl_popup_select&deploy=customdeploy_scv_sl_popup_select';
                let queryParams = '&action=' + _action + '&fieldId=' + _fieldId;
                window.SCV = window.SCV || {};
                const dataSource = JSON.parse(JSON.stringify(${JSON.stringify(dataSource)}));
                const propVal = 'data_' + _fieldId; 
                const propConfig = 'dataConfig_' + _fieldId;
                window.SCV[propVal] = dataSource;
                window.SCV[propConfig] = { PAGE_SIZE: +'${_PageSize}', FIELD_ID : _fieldId };
                const offsetWidth = window.document.getElementById('main_form').children[0].offsetWidth + 10;
                window.SCV['fn_'+_fieldId] = () => {window.nlExtOpenWindow(_urlPopup + queryParams, 'popUp_'+_fieldId,  683, 580, this, false, '${_NamePopup}')};//offsetWidth / 2 + 100
                let htmlPopup = \`
                    <span class="uir-field-widget">
                        <a data-helperbuttontype="list" id="{{fieldId}}_popup_list" tabindex="-1"
                            class="smalltextul fwmultisel uir-field-widget" title="Select"
                            href="javascript:void('{{fieldId}}')"
                            onclick="window.SCV.fn_{{fieldId}}(this);return false;"
                            onfocus="if (this.className.indexOf('_focus') == -1) this.className = this.className + '_focus'; return true;"
                            onblur="this.className = this.className.replace('_focus', ''); return true;">
                            <span class="material-icons" style="font-size: 18px;">keyboard_double_arrow_up</span>
                        </a>
                    </span>
                \`.replaceAll('{{fieldId}}', _fieldId);
                // Add CSS
                let head = document.getElementsByTagName('head')[0];
                let style = document.createElement('link');
                style.rel = 'stylesheet';
                style.type = 'text/css';
                style.href = 'https://fonts.googleapis.com/icon?family=Material+Icons'; 
                head.appendChild(style);
                let tempElement = document.createElement('div');
                tempElement.innerHTML = htmlPopup.trim();
                let spanElement = tempElement.firstChild;
                let inputElement = document.getElementById(_fieldId + '_fs');
                inputElement.parentNode.insertBefore(spanElement, inputElement.nextSibling);
            });
        </script>
        `;
			htmlPopup = htmlPopup.replaceAll('{{fieldId}}', fieldId);
			const randomId = +new Date();
			form.addField({
				id: "custpage_mulsl_" + randomId,
				label: "Multi Select",
				type: 'INLINEHTML',
			}).defaultValue = htmlPopup;
		}

		const includeLibaryExternalHtml = () =>{
            return `
                <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css">
                <link rel="stylesheet" href="https://cdn3.devexpress.com/jslib/21.1.6/css/dx.light.css" />
                <link rel="stylesheet" type="text/css" href="https://cdn3.devexpress.com/jslib/21.2.5/css/dx.common.css" />
                <script type="text/javascript" src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
                <script type="text/javascript" src="https://cdn3.devexpress.com/jslib/21.2.5/js/dx.all.js"></script>
                <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.2.1/exceljs.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
            `;
        }

        const includeTagStyleHtml = () =>{
            return `
            <style>
                .card {
                    min-height: 35rem;
                }
        
                .dx-header-row {
                    background-color: #E5E5E5 !important;
                    vertical-align: bottom;
                    color: #484848 !important;
                    font-size: 12px;
                    text-align: center!important;
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
                    font-size: 13px
                }
            </style>
            `;
        }

		return {
			addIconButtonExport,
			addClassBtnSubmit,
			addFrameUploadFile,
			renderDxGrid,
			renderDxGridV2,
			popupCenter,
			renderDxGridWithTab,
			renderDxGridTreeList,
			fnAddPopupFieldMultiSelect,
			fnAddPopupFieldSelect,
			includeLibaryExternalHtml,
			includeTagStyleHtml,
			addFieldFuncLoading,
		};
	});
