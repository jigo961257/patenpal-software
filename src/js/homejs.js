window.addEventListener("DOMContentLoaded", () => {
    console.log("lod home js");
    const btn = document.getElementById('btn')
    const btn_process = document.getElementById('btn_process')
    const filePathElement = document.getElementById('filePath')
    const process_at = document.getElementById('process_at')
    const loader = document.getElementById("loader");

    btn_process.setAttribute("hidden", true)
    btn.addEventListener('click', async () => {
        let filePath = await window.electronAPI.openFile()
        filePathElement.innerText = filePath
    })
    let status_global = 0;
    window.electronAPI.getStatus((event, value) => {
        const { status, message } = value;
        status_global = status;
        if(status === 1) {
            btn.setAttribute("disabled", true)
            loader.removeAttribute("hidden")
        }else if(status === 200){
            btn_process.removeAttribute("hidden")
            loader.setAttribute("hidden", true)
            btn.removeAttribute("disabled")
        }
        process_at.innerText = message
    })

    btn_process.addEventListener("click",() => {
        window.electronAPI.saveFile();
    })
})

