const markup = `
  <div class='steps_count_wrapper'>
    <div class='steps_text'>
      Total steps:
    </div>
    <div id='steps_count' class='steps_count'>
      0
    </div>
  </div>

  <div class='highlight_customization'>
    <div class='highlight_text'>
      Highlight colour :
      <input id='update_color' class="jscolor" value="ff69b4">
    </div>
    <div class='highlight_text'>
      Highlight width  :
      <input id='update_width' type='text' value='5'>
    </div>
  </div>

  <div class='setup_configuration'>
    <div class='add_element'>
      <button id='add_element' class='btn btn-default'>Add element</button>
    </div>
    <div class='modify_selection'>
      <button id='expand_target' class='btn btn-default'>Expand selection</button>
      <button id='contract_target' class='btn btn-default'>Contract selection</button>
    </div>
  </div>

  <div class='action_buttons'>
    <div class='info'>
      Use the left and right arrows keys to navigate when presenting.
    </div>
    <button id='present' class='btn btn-primary'>Present</button>
    <button id='stop_presentation' class='btn btn-default'>Stop</button>
    <button id='clear_storage' class='btn btn-default'>Reconfigure</button>
  </div>
 </div>
`;

chrome.runtime.onMessage.addListener(function(msg, sender){
  if(msg == "toggle"){
      toggle();
  }
});

var chromePresenterPanel = document.createElement('div'); 
chromePresenterPanel.classList.add('chrome_presenter_panel')
chromePresenterPanel.innerHTML = markup;
document.body.appendChild(chromePresenterPanel);

var index = -1;
var target;

function toggle() {
  if (chromePresenterPanel.style.width == "0px" || !chromePresenterPanel.style.width) {
    chromePresenterPanel.style.width="400px";
    chromePresenterPanel.style.display = "flex";
    updateSteps();
  }
  else {
    chromePresenterPanel.style.width="0px";
    chromePresenterPanel.style.display = "none";
  }
}

document.getElementById("add_element").addEventListener("click", ()=> {removeHighlight
  removeHighlight();
  toggle();
  document.addEventListener('click', myClick, false);
  document.addEventListener('mouseover', mouseEnter, false);
  document.addEventListener('mouseout', mouseLeave, false);
  index++;
});

function highlightNode(steps, index, prevIndex) {

  let previousDomElement = jQuery(steps[prevIndex])[0];
  if (!!previousDomElement)
    previousDomElement.classList.remove("chrome_presenter_highlight");
  
  let currentDomElement = jQuery(steps[index])[0];
  if (!!currentDomElement) {
    currentDomElement.scrollIntoViewIfNeeded({ block: "center" });
    // currentDomElement.scrollIntoView({ block: "center" });
    currentDomElement.classList.add("chrome_presenter_highlight");
  } else {
    console.log('element not found');
  }
}

function myClick(event) {
    target = event.target;
    if (target.id !== 'add_element') {
      document.removeEventListener('click', myClick);
      document.removeEventListener('mouseover', mouseEnter, false);
      document.removeEventListener('mouseout', mouseLeave, false);
      target.classList.remove('chrome_presenter_highlight');
      
      chrome.storage.sync.get(['presentationSteps'], function(result) {
        let steps = result.presentationSteps || [];
        steps.push(jQuery(target).getSelector({ ignore: { classes: ['chrome_presenter_highlight'] } })[0]);
        target.classList.add('chrome_presenter_highlight');
        chrome.storage.sync.set({'presentationSteps': steps}, () => {});
        toggle();
        updateSteps();
      });
    }
  event.preventDefault();
  }

function mouseEnter(e) {
  if (e.target !== e.currentTarget) {
    var tgt = e.target;
    tgt.classList.add('chrome_presenter_highlight');
    e.stopPropagation();
  }
}

function mouseLeave(e) {
  if (e.target !== e.currentTarget) {
    var tgt = e.target;
    tgt.classList.remove('chrome_presenter_highlight');
  }
  e.stopPropagation();
}

function keyPress(e) {
  let rightArrowKeys = [39, 124]; 
  let leftArrowKeys = [37];
  chrome.storage.sync.get(['presentationSteps'], function(result) {
    let steps = result.presentationSteps || [];
    let prevIndex = index >= 0 ? index : 0;
    if (rightArrowKeys.includes(e.keyCode)) {
      if (index + 1 <= steps.length -1)
        index++
      else
        index = 0;

      highlightNode(steps, index, prevIndex);
  } else if (leftArrowKeys.includes(e.keyCode)) {
    if (index - 1 >= 0)
      index--
    else
      index = steps.length -1;

    highlightNode(steps, index, prevIndex);
  }
  });
}

document.getElementById("clear_storage").addEventListener("click", ()=> {
  chrome.storage.sync.set({'presentationSteps': []}, function() {});
  updateSteps();
  index = -1;
  removeHighlight();
});

document.getElementById("present").addEventListener("click", ()=> {
  toggle();
  index = -1;
  removeHighlight();
  window.addEventListener('keyup', keyPress, false);
});

document.getElementById("stop_presentation").addEventListener("click", ()=> {
  index = -1;
  toggle();
  removeHighlight();
  window.removeEventListener('keyup', keyPress, false);
  chrome.storage.sync.get(['presentationSteps'], function(result) {
    let currentDomElement = document.querySelector(result.presentationSteps[index]);
    currentDomElement.classList.remove("chrome_presenter_highlight");
  });
});

document.getElementById("expand_target").addEventListener("click", ()=> {
  if (target) {
    target.classList.remove('chrome_presenter_highlight');
    target = target.parentNode;
  
    chrome.storage.sync.get(['presentationSteps'], function(result) {
      let steps = result.presentationSteps || [];
      steps[index] = jQuery(target).getSelector({ ignore: { classes: ['chrome_presenter_highlight'] } })[0];
      chrome.storage.sync.set({'presentationSteps': steps}, function() { });
      target.classList.add('chrome_presenter_highlight');
    });
  }
});

document.getElementById("contract_target").addEventListener("click", () => {
  if (target) {
    target.classList.remove('chrome_presenter_highlight');
    if (target.childNodes[0] && target.childNodes[0].tagName)
      target = target.childNodes[0]
  
    chrome.storage.sync.get(['presentationSteps'], function (result) {
      let steps = result.presentationSteps || [];
      steps[index] = jQuery(target).getSelector({ ignore: { classes: ['chrome_presenter_highlight'] } })[0];
      chrome.storage.sync.set({ 'presentationSteps': steps }, function () { });
      target.classList.add('chrome_presenter_highlight');
    });
  }
});

document.getElementById("update_color").addEventListener("change", (e) => {
  updateCss();
});

document.getElementById("update_width").addEventListener("change", (e) => {
  updateCss();
});

function updateCss() {
  let color = document.getElementById('update_color').value;
  let width = document.getElementById('update_width').value;
  
  var style = document.createElement('style');
  style.innerHTML =
    `.chrome_presenter_highlight { 
      outline: ${width}px solid #${color} !important; 
      outline-offset: -4px !important;
    }`;

  var ref = document.querySelector('script');
  ref.parentNode.insertBefore(style, ref);
}

function updateSteps() {
  chrome.storage.sync.get(['presentationSteps'], function (result) {
    let steps = result.presentationSteps || [];
    document.getElementById('steps_count').textContent = steps.length;
  });
}

function removeHighlight() {
  let highlightedDomelements = document.querySelectorAll('.chrome_presenter_highlight') || [];
  highlightedDomelements.forEach(item => item.classList.remove('chrome_presenter_highlight'));
}