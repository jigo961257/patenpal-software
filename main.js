const { app, BrowserWindow, dialog, ipcMain, Menu } = require("electron")
const path = require("path")
const xlsAll = require("xlsx")
const puppeteer = require("puppeteer")

let global_win_obj = null;
const isMac = process.platform === 'darwin'

const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
        label: "patenpal",
        submenu: [
            { label: "About" },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : []),
    // { role: 'fileMenu' }
    {
        label: 'File',
        submenu: [
            isMac ? { role: 'close' } : { role: 'quit' }
        ]
    },
    {
        role: 'help',
        submenu: [
            {
                label: 'Learn More',
            }
        ]
    }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
const delay = ms => new Promise(
    resolve => setTimeout(resolve, ms)
);
const createWindow = () => {
    const win1 = new BrowserWindow({
        height: 600,
        width: 800,
        title:"patenpal-app",
        webPreferences: {
            preload: path.join(__dirname, "/src/preloads/homePreload.js")
        }
    });
    global_win_obj = win1;
    // win1.webContents.openDevTools();

    win1.loadFile("pages/home.html");
}

app.whenReady().then(() => {
    // ipcMain.handle('dialog:openFile', handleFileOpen)

    createWindow();
    ipcMain.on("dialog:openFile", handleFileOpen)
    ipcMain.on('dialog:saveFile', hadelfil_dowload)
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})


app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
})
let filePath_global = null
async function handleFileOpen() {
    const { canceled, filePaths } = await dialog.showOpenDialog()
    if (canceled) {
        return
    } else {
        filePath_global = filePaths[0]
        performACtion(filePath_global)
        return filePaths[0]
        // ipcRenderer.sendSync()
    }
}
var wb = xlsAll.utils.book_new();
let worksheets_of_read = {}
let worksheets_of_write = {}

async function performACtion(file_path) {
    const read_file = xlsAll.readFile(file_path)
    console.log(read_file.SheetNames);
    // console.log(global_win_obj);
    global_win_obj.webContents.send('update-status', { status: 1, message: "start to process" })

    let count = 0;
    let b_summary = [], b_disc_of_figure = [], d_discription = [], d_abstract = [];
    let isWorkSheetIsPreset = wb.SheetNames.find(el => el === "patenpal");
    if (isWorkSheetIsPreset === undefined) {
        let data = [["Code", "Brife Summary", "Brife Discription of Figure", "Detailed DescriptionS", "Abstract", "Status", "Claim"]]
        let worksheet_new = xlsAll.utils.aoa_to_sheet(data);
        xlsAll.utils.book_append_sheet(wb, worksheet_new, "patenpal");
    }


    for (const sheetname of wb.SheetNames) {
        worksheets_of_write[sheetname] = xlsAll.utils.sheet_to_json(wb.Sheets[sheetname])
    }


    for (const sheetname of read_file.SheetNames) {
        worksheets_of_read[sheetname] = xlsAll.utils.sheet_to_json(read_file.Sheets[sheetname])
    }

    let raw_worksheet_data_len = worksheets_of_read.Raw.length;
    console.log("raw_worksheet_data_len : ", raw_worksheet_data_len);
    try {
        const broweser = await puppeteer.launch({
            headless: true,
            // executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",

        });
        global_win_obj.webContents.send('update-status', { status: 2, message: "perform action in file" })
        const page = await broweser.newPage()
        await page.goto("https://draft.patentpal.com/", { waitUntil: "domcontentloaded" }).then(async (res) => {
            const getLoginForm = "#login";
            await page.waitForSelector(getLoginForm).then(async () => {
                await page.type("#input-15", "jignesh@jtattorneyalliance.com", { delay: 0 })
                await page.type("#input-19", "Jitu1@jtaa", { delay: 0 });

                await page.click("span[class='v-btn__content']").then(async () => {
                    const theBlankDoc = ".box.blankDocument"
                    await page.waitForSelector(theBlankDoc).then(async () => {
                        await page.click(theBlankDoc).then(async () => {

                            let i = 0;
                            global_win_obj.webContents.send('update-status',
                                {
                                    status: 3,
                                    message: ("detect claims:" + raw_worksheet_data_len + " claims processing..")
                                })
                            while (i !== raw_worksheet_data_len) {

                                const getClaimBox = "#quill-claims"
                                await page.waitForSelector(getClaimBox).then(async () => {
                                    await page.click(getClaimBox).then(async () => {

                                        const claimTextBox = "#quill-claims > div.ql-editor"
                                        await page.waitForSelector(claimTextBox).then(async () => {
                                            await page.evaluate((claim_data, i) => {
                                                let input_text_box = document.querySelector("#quill-claims > div.ql-editor");
                                                input_text_box.textContent = claim_data[i].Claim;
                                            }, worksheets_of_read.Raw, i).then(async () => {
                                                const getClickButton = ".arrowButton"
                                                await page.waitForSelector(getClickButton).then(async () => {
                                                    await page.click(getClickButton).then(async () => {
                                                        const letWaitUntilDownloadVisiable = "button[class='v-btn v-btn--text theme--light v-size--default']"
                                                        await page.waitForSelector(letWaitUntilDownloadVisiable).then(async () => {
                                                            let final_output_data = await page.evaluate((c, b_sum, b_dis_fig, d_dis, d_abs) => {
                                                                let element = document.querySelector("#quill-description div.ql-editor").children;
                                                                for (let i = 0; i < element.length; i++) {
                                                                    if (element[i].tagName == "H2") {
                                                                        c += 1;
                                                                    } else if (element[i].tagName === "P" && c == 1) {
                                                                        b_sum.push(element[i].textContent)
                                                                    } else if (element[i].tagName === "P" && c == 2) {
                                                                        b_dis_fig.push(element[i].textContent)
                                                                    } else if (element[i].tagName === "P" && c == 3) {
                                                                        d_dis.push(element[i].textContent)
                                                                    } else if (element[i].tagName === "P" && c == 4) {
                                                                        d_abs.push(element[i].textContent)
                                                                    } else {
                                                                        c = 0;
                                                                    }
                                                                }
                                                                let res_obj = {}
                                                                res_obj.b_sum = b_sum.toString()
                                                                res_obj.b_dis_fig = b_dis_fig.toString()
                                                                res_obj.d_dis = d_dis.toString()
                                                                res_obj.d_abs = d_abs.toString()
                                                                return res_obj
                                                            }, count, b_summary, b_disc_of_figure, d_discription, d_abstract);

                                                            worksheets_of_write.patenpal.push({
                                                                "Code": worksheets_of_read.Raw[i].Code,
                                                                "Brife Summary": final_output_data.b_sum,
                                                                "Brife Discription of Figure": final_output_data.b_dis_fig,
                                                                "Detailed Description": final_output_data.d_dis,
                                                                "Abstract": final_output_data.d_abs,
                                                                "Claim": worksheets_of_read.Raw[i].Claim,
                                                                "Status": true,
                                                            })

                                                            final_output_data = null
                                                        });
                                                    });
                                                });
                                            })
                                            // return

                                        });
                                    })
                                });
                                global_win_obj.webContents.send('update-status',
                                    {
                                        status: 4,
                                        message: ("claims complete :" + (i + 1).toString() + "/" + raw_worksheet_data_len)
                                    })
                                console.log("current text pick = ", i);
                                i++;
                                console.log("now text pick = ", i);
                                await delay(1500);

                            }
                            // console.log(worksheets_of_write.patenpal);
                            // xlsAll.utils.sheet_add_json(worksheets_of_write, worksheets_of_write.patenpal)

                            await broweser.close();
                            global_win_obj.webContents.send('update-status', { status: 200, message: "claim process done, dowload it" })
                        });
                    })
                })
            })
        })
    } catch (err) {
        console.log("err => \n", err);
    }
    // setTimeout(() => {
    //     global_win_obj.webContents.send('update-status', { status: 200, message: "file process done, dowload it" })
    //     wb.Props = {
    //         Title: "test_sheet",
    //         Subject: "text",
    //         Author: "jigogyani"
    //     }
    //     wb.SheetNames.push("newSheet1")
    //     var ws = xlsAll.utils.aoa_to_sheet([["heelow", "jeegar"]])
    //     wb.Sheets["newSheet1"] = ws
    //     console.log(wb);
    // }, 5000);


}

async function hadelfil_dowload() {
    let get_localpath = path.resolve(app.getPath("desktop"), "final_output.xlsx")
    const { canceled, filePath } = await dialog.showSaveDialog(global_win_obj, { defaultPath: get_localpath })
    if (canceled) {
        return
    } else {
        console.log("file is save at: ", filePath);
        // console.log(worksheets_of_write);
        // wb = worksheets_of_write
        xlsAll.utils.sheet_add_json(wb.Sheets["patenpal"], worksheets_of_write.patenpal)
        // console.log(wb);
        xlsAll.writeFile(wb, filePath)
    }
}