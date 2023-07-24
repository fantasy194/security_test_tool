/**
 * @Created by jiangxinchen on 2023/7/24
 */

const playerWindow = (window.globalProvideData && window) || document.querySelector("#main_iframe")?.contentDocument.querySelector("#jca_course_player")?.contentWindow.window
const playerDocument = playerWindow?.document

let orgFun = playerWindow?.globalProvideData;

if (!orgFun) {
    console.error("Hook failed!")
}

playerWindow.globalProvideData = new Proxy(orgFun, {
    apply: (t, thisArg, [dataMode, data]) => {
        try {
            if ("slide" === dataMode) {
                refreshSlideAnswers(data)
            }
        } catch (e) {
            console.error(e)
        }
        return t(dataMode, data)
    }
})

refreshSlideAnswers = (e) => {
    let correct = [];
    const regex = /\"(\w+)\.(\w+)\.\$OnStage\"/gm;
    while ((result = regex.exec(e)) != null) {
        correct.push(result[2]);
    }
    for (let id of correct) {
        console.log("Correct: " + id)
        setTimeout(() => {
            let element = playerDocument.querySelector(".slide-object[data-model-id='" + id + "']");
            element?.style?.setProperty("background-color", "green")
        }, 100)
    }
}
playerDocument.querySelector("#frame")?.insertAdjacentHTML('afterbegin', '<button style="position:absolute;top:5px;right:5px;z-index:1000" onclick="DS.pubSub.trigger(DS.events.presentation.ON_OBJECT_EVENT, \'next_pressed\')">JUMP!!!</button>');
