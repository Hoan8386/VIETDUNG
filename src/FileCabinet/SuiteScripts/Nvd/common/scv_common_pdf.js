/**
 * @NApiVersion 2.1
 */
define(['N/query', 'N/render', 'N/search', 'N/format/i18n', 'N/file'],
    (query, render, search, i18n, file) => {

        const initTemplateRender = (templateId) => {
            let tmplRender = render.create();
            if (isNaN(templateId)) {
                tmplRender.setTemplateByScriptId(templateId);
            } else {
                tmplRender.setTemplateById(templateId);
            }

            return tmplRender;
        }

        const convertAmountToWords = (currency) => {
            let amountRaw = i18n.spellOut({
                number: currency,
                locale: "vi_VN"
            });

            return amountRaw[0].toUpperCase() + amountRaw.slice(1) + ' đồng';

        }

        const addFontVietnamese = (objRender) => {
            let listFileFontInfo = getListFileFontInfo();
            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "libPdf",
                data: {
                    font: {
                        times: unReTextXML((listFileFontInfo.find(o => o.name === 'times_src.ttf')?.url || '')),
                        times_bold: unReTextXML((listFileFontInfo.find(o => o.name === 'times_bold.ttf')?.url || '')),
                        times_italic: unReTextXML((listFileFontInfo.find(o => o.name === 'times_italic.ttf')?.url || '')),
                        times_bolditalic: unReTextXML((listFileFontInfo.find(o => o.name === 'times_italic_bold.ttf')?.url || '')),

                        arial: listFileFontInfo.find(o => o.name === 'arial_src.ttf')?.url || '',
                        arial_bold: listFileFontInfo.find(o => o.name === 'arial_bold.ttf')?.url || '',
                        arial_italic: listFileFontInfo.find(o => o.name === 'arial_italic.ttf')?.url || '',
                        arial_bolditalic: listFileFontInfo.find(o => o.name === 'arial_italic_bold.ttf')?.url || ''
                    },
                    css :  file.load({id : '../css/scv_pdf_print.css'}).getContents()
                }
            })
        }

        const addBackgroundImage = (objRender, backGroundImageName) => {
            let listBackGroundImagesInfo = getListBackGroundImagesInfo();
            let urlImage = listBackGroundImagesInfo.find(o => o.name === backGroundImageName)?.url || '';

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "backgroundImage",
                data: {
                    url: urlImage
                }
            });
        }

        // thêm ${image.url?html} vào template sau img src =
        const addImage = (objRender, imageName) => {
            let listImagesInfo = getListImagesInfo(imageName);
            let urlImage = listImagesInfo.find(o => o.name === imageName)?.url || '';

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "image",
                data: {
                    url: urlImage
                }
            });
        }

        const getListUrlImagesByName = (name) => {
            let listImagesInfo = getListImagesInfo();
            return listImagesInfo.find(o => o.name === name)?.url || '';
        }

        const getListUrlImagesByIds = (arrIds) => {
            let strListIds = arrIds.reduce((acc, item) => {
                if (item !== null && item !== '' && item !== undefined) {
                    acc.push(item);
                }
                return acc;
            }, []);
            if( strListIds.length === 0) {
                return []
            }

            strListIds = strListIds.join("','");

            let sqlImagesInfo = `select f.id, f.name, f.url
                                 from file f
                                 where f.filetype IN ('PNGIMAGE', 'JPGIMAGE')
                                   and f.id IN (${strListIds})`;
            return query.runSuiteQL({query: sqlImagesInfo, params: []}).asMappedResults();
        }

        const getListFileFontInfo = () => {
            let sqlFileFontInfo = "select f.name, f.url from file f where f.filetype IN ('TTF')";
            return query.runSuiteQL({query: sqlFileFontInfo, params: []}).asMappedResults();
        }

        const getListBackGroundImagesInfo = () => {
            let sqlImagesInfo = "select f.name, f.url from file f where f.filetype IN ('PNGIMAGE', 'JPGIMAGE')  and f.name like '%background%'";
            return query.runSuiteQL({query: sqlImagesInfo, params: []}).asMappedResults();
        }

        const getListImagesInfo = (imageName) => {
            let sqlImagesInfo = "select f.name, f.url from file f where f.filetype IN ('PNGIMAGE', 'JPGIMAGE')";
            if (imageName) {
                sqlImagesInfo += ` and f.name = '${imageName}'`;
            }
            return query.runSuiteQL({query: sqlImagesInfo, params: []}).asMappedResults();
        }

        const unReTextXML = (text) => {
            let newText = text;
            if (!!text && typeof text === "string") {
                newText = newText.replace(/&/gi, '&amp;').replace(/>/gi, "&gt;").replace(/</gi, "&lt;").replace(/'/g, "&apos;").replace(/"/g, "&quot;");
            }
            return newText;
        }

        const addCustomSubsidiary = (objRender, subsidiaryId) => {
            let lkFieldsSubsidiary = search.lookupFields({
                type: search.Type.SUBSIDIARY,
                id: subsidiaryId,
                columns: [
                    'legalname',
                    'address.address',
                    'address.address1',
                    'address.address2',
                    'address.address3',
                    'custrecord_scv_sub_ktt',
                    'address.phone'
                ]
            });

            objRender.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: "subsidiary",
                data: {
                    legalname: lkFieldsSubsidiary['legalname'],
                    address: lkFieldsSubsidiary['address.address'],
                    address1: lkFieldsSubsidiary['address.address1'],
                    address2: lkFieldsSubsidiary['address.address2'],
                    address3: lkFieldsSubsidiary['address.address3'],
                    custrecord_scv_sub_ktt: lkFieldsSubsidiary['custrecord_scv_sub_ktt'],
                },
            })
        }

        const addScriptButton = () => {
            return `<script>
        const urlPdfIcon = "https://img.icons8.com/office/24/pdf.png";
        const urlExcelIcon = "https://img.icons8.com/color/24/microsoft-excel-2019--v1.png";
        const urlWordIcon = 'https://img.icons8.com/color/24/microsoft-word-2019--v2.png';

        const PRINT_TYPE={
            'pdf': urlPdfIcon,
            'excel': urlExcelIcon,
            'word': urlWordIcon,
        }

        $(() => {
           alert('addIconToButtonVer2');
            addIconToButtonVer2('custpage_scv');
        });

        const addIconToButtonVer2 = (patternBtnId) => {
            document.querySelectorAll(\`[id^=\${patternBtnId}]\`).forEach((button) => {
                addIconToButton(button.id);
            });
            document.querySelectorAll(\`[id^=secondary\${patternBtnId}]\`).forEach((button) => {
                addIconToButton(button.id);
            });
        }

        const addIconToButton = (buttonId) => {
            let iconUrl;
            Object.keys(PRINT_TYPE).forEach((printType) => {
                if (buttonId.includes(printType.toLowerCase())) {
                    iconUrl = PRINT_TYPE[printType];
                }
            });

            const buttonElement = document.getElementById(buttonId);// Get the button by ID
            if (buttonElement) {
                //Set the button's style for Excel icon
                buttonElement.style.setProperty('padding-left', '54px', 'important'); // Add padding
                buttonElement.style.setProperty('background-image', \`url(\${iconUrl})\`, 'important'); // Set background image
                buttonElement.style.setProperty('background-repeat', 'no-repeat', 'important'); // Prevent background repeat
            }
        }

    </script>`;
        }

        return {
            addFontVietnamese,
            initTemplateRender,
            addCustomSubsidiary,
            addBackgroundImage,
            convertAmountToWords,
            addImage,
            addScriptButton,
            getListUrlImagesByIds,
            getListImagesInfo,
            getListUrlImagesByName
        }

    });
