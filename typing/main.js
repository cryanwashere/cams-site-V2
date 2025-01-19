
text_sections = ['The quick brown fox jumped over the lazy white dog!'];
current_text_section = 0;

current_book = 'books/gatsby.txt';

var sessionData = {
    keyIdArray : [],
    keyCharArray : [],
    cursorIdx : 0,
}


function setupTypingArea() {

    let text = text_sections[current_text_section];

    let characters = text.split('');

    sessionData.keyCharArray = characters;

    // reset the data for the typing area
    sessionData.cursorIdx = 0;
    sessionData.keyIdArray = [];
    console.log(characters);


    let typingDiv = document.getElementById('typing-area');
    typingDiv.innerHTML = "";

    for (let i = 0; i < characters.length; i++) {
        character_id = generateUUID();
        character_element = document.createElement("span");
        character_element.id = character_id;
        character_element.className = "typing-char";
        character_element.className += " untyped";
        character_element.innerHTML = characters[i];
        typingDiv.appendChild(character_element);
        sessionData.keyIdArray.push(character_id);
    }

    document.getElementById(sessionData.keyIdArray[sessionData.cursorIdx]).classList.add("cursor");
}




function handleKeyup(e) {}
function handleKeydown(e) {
    if (e.key == "Shift") { return }

    var correct = false 

    
    let current_char = sessionData.keyCharArray[sessionData.cursorIdx]

    if (e.key == current_char) {correct = true;}
    if (e.key == "'" && current_char == '’') {correct = true;}
    if (e.key == "i" && current_char == "ï") {correct = true;}
    if (e.key == "a" && current_char == "à") {correct = true;} 
    if (e.key == "a" && current_char == "ä") {correct = true;}
    if (e.key == "a" && current_char == "æ") {correct = true;}

    if (e.key == "o" && current_char == "ö") {correct = true;}
    if (e.key == "o" && current_char == "ò") {correct = true;}
    if (e.key == "u" && current_char == "ù") {correct = true;}
    if (e.key == "u" && current_char == "ü") {correct = true;}
    if (e.key == "." && current_char == "…") {correct = true;}
    if (e.key == "o" && current_char == "ô") {correct = true;}

    if (e.key == '"' && (current_char == '“' || current_char == '”')) {correct = true;}
    
    let character_element = document.getElementById(sessionData.keyIdArray[sessionData.cursorIdx]);
    character_element.classList.remove("untyped");
    if (correct) {
        character_element.classList.add("typed-correct");

        // iterate the cursor
        sessionData.cursorIdx += 1;

        //console.log(sessionData.cursorIdx, sessionData.keyCharArray.length);

        // check if the text section has been completed:
        if (sessionData.cursorIdx >= sessionData.keyCharArray.length) {
            console.log("section completed");
            current_text_section += 1;
            setupTypingArea(text_sections[current_text_section]);
            setCookie(current_book, current_text_section);

            return;
        }

        document.getElementById(sessionData.keyIdArray[sessionData.cursorIdx - 1]).classList.remove("cursor");
        document.getElementById(sessionData.keyIdArray[sessionData.cursorIdx]).classList.add("cursor");
        
    } else {
        if (!character_element.classList.contains("typed-error")) {
            character_element.classList.add("typed-error");
        }
        //console.log("typing error");
        //console.log(e, current_char);
    }
}


document.addEventListener('keydown', handleKeydown);
document.addEventListener('keyup', handleKeyup);

function generateUUID() {
    /* IDK how this works */
    let d = new Date().getTime();
    let d2 = (performance && performance.now && (performance.now()*1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16;
      if(d > 0){
        r = (d + r)%16 | 0;
        d = Math.floor(d/16);
      } else {
        r = (d2 + r)%16 | 0;
        d2 = Math.floor(d2/16);
      }
      return (c==='x' ? r : (r&0x3|0x8)).toString(16);
    });
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}
function setCookie(cname, value) {
    document.cookie = `${cname}=${value}`;
}

function loadBook(path) 
{
    fetch(path).then(res => res.text()).then(book_text => {
        
        book_text = book_text.replace(new RegExp('\r', 'g'),"");
        var book_sections = book_text.split('\n');
        book_sections = book_sections.filter(
            e => e != ''
        );
        text_sections = book_sections;
        console.log(text_sections);
        
        
        current_text_section = parseInt(getCookie(path));

        if (isNaN(current_text_section)) {
            current_text_section = 0;
        }
        
        console.log(`current text section: ${current_text_section} for ${path}`);

        setupTypingArea();
    });
}

function changeBook() {
    let book_path = document.getElementById('bookSelector').value;
    console.log(book_path);
    current_book = book_path;
    loadBook(book_path);
}

loadBook(current_book);

document.getElementById('bookSelector').addEventListener('change', changeBook);