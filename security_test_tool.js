let orgFun = window.globalProvideData;
window.globalProvideData = new Proxy(orgFun, {
    apply: (t, thisArg, args) => {
        try {
            refreshAnswers(args[1])
        } catch (e) {
            console.error(e)
        }
        return t(args[0], args[1])
    }
})

refreshAnswers = (e) => {
    let correct = [];
    const regex = /\"(\w+)\.(\w+)\.\$OnStage\"/gm;
    while ((result = regex.exec(e)) != null) {
        correct.push(result[2]);
    }
    for (let id of correct) {
        setTimeout(() => document.querySelector(".slide-object[data-model-id='" + id + "']")?.style?.setProperty("background-color", "green"), 100)
    }
}
document.querySelector("#frame").insertAdjacentHTML('afterbegin', '<button style="position:absolute;top:5px;right:5px;z-index:1000" onclick="DS.pubSub.trigger(DS.events.presentation.ON_OBJECT_EVENT, \'next_pressed\')">JUMP!!!</button>');
