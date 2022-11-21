window.addEventListener("DOMContentLoaded", () => {
    console.log("lod home js");
    const btn = document.getElementById('btn')
    const btn_process = document.getElementById('btn_process')
    const filePathElement = document.getElementById('filePath')
    const process_at = document.getElementById('process_at')
    const loader = document.getElementById("loader");

    const error_div = document.getElementById("error-container")
    const error_text = document.getElementById("error");

    // for path
    const setButton = document.getElementById('btn_path')
    const titleInput = document.getElementById('title')

    btn_process.setAttribute("hidden", true)
    btn.addEventListener('click', async () => {
        let filePath = await window.electronAPI.openFile()
        filePathElement.innerText = filePath
    })
    let status_global = 0;
    window.electronAPI.getStatus((event, value) => {
        const { status, message } = value;
        status_global = status;
        if (status === 1) {
            btn.setAttribute("disabled", true)
            loader.removeAttribute("hidden")
        }
        else if (status === 500) {
            error_div.removeAttribute("hidden")
            error_text.innerText = message;
            btn.removeAttribute("disabled")
            process_at.innerText = "proccess faild for some reson"
            loader.removeAttribute("hidden")
        }
        else if (status === 200) {
            btn_process.removeAttribute("hidden")
            loader.setAttribute("hidden", true)
            btn.removeAttribute("disabled")
        }
        if (status !== 500) {
            process_at.innerText = message
        }
    })

    btn_process.addEventListener("click", () => {
        window.electronAPI.saveFile();
    })

    

    
    setButton.addEventListener('click', () => {
        const title = titleInput.value
        window.electronAPI.setPath(title)
    });
})

