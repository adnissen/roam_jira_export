
function exportToJira() {
    //once the button is pressed
    //article is the whole page
    var article = document.getElementsByClassName('roam-article')[0];
    //first child of the article is the header and content, second child is the references section

    //get the header and content
    var articleTop = article.children[0];
    //first child of the "articleTop" is the header, second is the boxes with actual content

    var articleBlocks = articleTop.children[1];
    //each child of the articleBlocks is a bullet point, a "roam block"

    var allBlocks = Array.from(articleBlocks.children)

    //we need to start keeping track of what level child we're at, as well as the output
    //each element of this array is a block
    var output = [];

    function processBlock(block) {
        //the first child of each articleBlock is the top-level bullet point
        //the second child contains another articleBlock with it's children
        var ret = [];
        //add the top level text to our array

        var resultStr = "";
        //if we're at the top level, this will work
        
        var allChildNodes;
        if (!!block.children[0].children[0].children[1]) {
            allChildNodes = Array.from(block.children[0].children[0].children[1].children[0].childNodes);
        } else {
            allChildNodes = Array.from(block.children[0].children[0].children[0].children[1].children[0].childNodes);
        }

        //otherwise, we need to go another level down
        allChildNodes.forEach(childNode => {
            //3 is text
            if (childNode.nodeName == "#text") {
                //just add text right to the result string
                resultStr = resultStr + childNode.wholeText;
            } else if (childNode.nodeName == "DIV" && childNode.children[0].nodeName == "TEXTAREA") { //1 is div. if it has a child assume it's a code block
                resultStr = resultStr + "{code}\n" + childNode.children[0].textContent + "\n{code}";
            } else if (childNode.nodeName == "DIV" && childNode.children[1] && childNode.children[1].nodeName == "TEXTAREA") {
                resultStr = resultStr + "{code}\n" + childNode.children[1].textContent + "\n{code}";
            } else if (childNode.nodeName == "CODE") {
                resultStr = resultStr + "{{" + childNode.textContent + "}}";
            } else if (childNode.nodeName == "SPAN" && !!childNode.children[0] && childNode.children[0].classList.contains("check-container")) { //we've got a check box
                if (childNode.children[0].children[0].checked) {
                    resultStr = resultStr + "[*] " + childNode.textContent;
                } else {
                    resultStr = resultStr + "[ ] " + childNode.textContent;
                }
            } else if (childNode.nodeName == "DIV" && !!childNode.children[1] && !!childNode.children[1].children[0] && childNode.children[1].children[0].src) { //it's an image, we think 
                resultStr = resultStr + "!" + childNode.children[1].children[0].src + "!";
            } else { //just naively get the text from the div.
                resultStr = resultStr + childNode.textContent;
            }
        })
        //now that we've fixed the text content in our block, add it to the results
        ret.push(resultStr);
        if (!!block.children[1] && block.children[1].children.length != 0) {
            var parallelChildren = Array.from(block.children[1].children);
            parallelChildren.forEach(parallelChild => {
                ret.push(processBlock(parallelChild));
            });
        }
        return ret;
    }

    allBlocks.forEach(articleBlock => {
        output.push(processBlock(articleBlock));
    });

    //take output and actually make a string
    function makeOutput(output, level = 1) {
        var outString = ""
        output.forEach(element => {
            if (typeof(element) == "string") {
                outString = outString.concat("*".repeat(level), " ", element, "\n");
            } else {
                outString = outString.concat(makeOutput(element, level + 1));
            }
        });
        return outString;
    }

    var finalString = ""
    output.forEach(topLevelBlock => {
        finalString = finalString.concat(makeOutput(topLevelBlock));
    })
    return finalString;
}

var menu = document.getElementsByClassName('bp3-icon-more')[0];
if (!!menu) {
    menu.addEventListener("click", function(){
        //we need to wait 100ms for the menu element to render so we can append it
        //probably less, but I can't see it actually change so I don't think it matters
        setTimeout(function(){
            //add our button to the menu
            var template = document.createElement('template');
            template.innerHTML = '<li class="jira-export"><a class="bp3-menu-item bp3-popover-dismiss"><div class="bp3-text-overflow-ellipsis bp3-fill">Export to JIRA</div></a></li>'
            document.getElementsByClassName("bp3-menu")[0].appendChild(template.content);
            document.getElementsByClassName("jira-export")[0].addEventListener("click", function(){
                navigator.permissions.query({name: "clipboard-write"}).then(result => {
                    if (result.state == "granted" || result.state == "prompt") {
                        navigator.clipboard.writeText(exportToJira()).then(function() {
                            alert("Successfully Copied to Clipboard");
                        }, function() {
                            alert("Some sort of Error, check console for details");
                        });
                    }
                });
            });
        }, 100);
    });
} else {
    console.log("no menu!");
}