/**
 * @Updated by jiangxinchen on 2024/6/18
 */

function findWindowWithProperty(win, propertyName) {
    try {
        if (win[propertyName] !== undefined) {
            return win;
        }
    } catch (e) {
        // Ignore cross-origin errors
    }

    for (let i = 0; i < win.frames.length; i++) {
        const foundWin = findWindowWithProperty(win.frames[i], propertyName);
        if (foundWin) {
            return foundWin;
        }
    }

    return null;
}

function getWindowWithProperty(propertyName) {
    return findWindowWithProperty(window, propertyName);
}

// Example usage
const courseDataWindow = getWindowWithProperty('courseData');
const globalProvideDataWindow = getWindowWithProperty('globalProvideData');

if (!courseDataWindow && !globalProvideDataWindow){
    console.error("Hook failed")
}

if (globalProvideDataWindow){
    console.log("Target globalProvideData")
    const playerWindow = globalProvideDataWindow
    const playerDocument = playerWindow.document
    const orgFun = playerWindow.globalProvideData
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
        correct.forEach(answerId => setTimeout(() => markCorrect(playerDocument.querySelector(".slide-object[data-model-id='" + answerId + "']")), 100))
    }

    playerDocument.querySelector("#frame")?.insertAdjacentHTML('afterbegin', '<button style="position:absolute;top:5px;right:5px;z-index:1000;color:red;font-weight:bold" onclick="DS.pubSub.trigger(DS.events.presentation.ON_OBJECT_EVENT, \'next_pressed\')">JUMP!!!</button>');
}

if (courseDataWindow) {
    console.log("Target courseData")
    const playerDocument = courseDataWindow.document
    refreshAnswers = () => {
        const currentTitle = playerDocument.querySelector('.lesson-link--active')?.innerText
        JSON.parse(atob(courseDataWindow.courseData))?.course?.lessons
            ?.filter(({type}) => type==="quiz")
            .filter(({title}) => currentTitle ? currentTitle.includes(title) : true)
            .flatMap(({items}) => items)
            .flatMap(({id: sid, questions, ...rest}) => questions?.map(q => ({sid, ...q})) || [{id: sid, ...rest}])
            .flatMap(({sid, id: pid, type, correct, corrects, answers}) => "MULTIPLE_CHOICE" === type
                ? [{sid, pid, val: correct, answers}]
                : (corrects?.map(val => ({sid, pid, val, answers})) || []))
            .forEach(({sid, pid, val, answers}) => {
                if (sid) {
                    let el = playerDocument.querySelector(`div[aria-labelledby="q-${sid}-${pid}"]`)
                    if (!el) {
                        el = playerDocument.querySelector(`.quiz-item__card--active .quiz-card__interactive`)
                    }
                    answers
                        .filter(({correct}) => correct)
                        .map(({title}) => stripHtmlTagsAndDecode(title))
                        .forEach(correctTitle => {
                            el?.querySelectorAll("p")
                                .forEach(pTag => {
                                    console.log(pTag)
                                    if (pTag.innerText === correctTitle){
                                        markCorrect(pTag)
                                    }
                                })
                        })
                }else {
                    const el = playerDocument.querySelector(`label[for="option-${pid}-${val}"]`)
                    markCorrect(el)
                }
            })
    }
    refreshAnswers()

    new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                let isQuiz = false
                mutation.addedNodes.forEach(node => {
                    if (node instanceof Element) {
                        if (node.querySelector('div[data-type="quiz"]')
                            || node.className.includes("quiz")){
                            isQuiz = true
                        }
                    }
                });
                mutation.removedNodes.forEach(node => {
                    if (node instanceof Element) {
                        if (node.querySelector('div[data-type="quiz"]')
                            || node.className.includes("quiz")){
                            isQuiz = true
                        }
                    }
                });
                if (isQuiz){
                    refreshAnswers()
                    console.log("load answers")
                }
            }
        }
    }).observe(playerDocument.querySelector("div.lesson__content"), {
        childList: true,
        subtree: true
    });

    playerDocument.querySelector("#app")?.insertAdjacentHTML('afterbegin', '<p style="color: red; font-weight: bold; position: absolute; top: 10px; right: 10px; z-index: 1000">ANSWER_HIGHLIGHTING_IS_ON</p>');
    // bodyObserver.disconnect();
}


function stripHtmlTagsAndDecode(str) {
    const textWithoutHtml = str.replace(/<\/?[^>]+(>|$)/g, "");

    const tempElement = document.createElement('div');
    tempElement.innerHTML = textWithoutHtml;

    return tempElement.textContent || tempElement.innerText;
}

function markCorrect(element) {
    element?.style?.setProperty("background-color", "green")
    element?.style?.setProperty("color", "white")
}
