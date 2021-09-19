// This injects a box into the page that moves with the mouse;
// Useful for debugging

async function trackPointer(page) {
    try {
        page.addInitScript(pointerTracker);
    } catch (error) {
        page.evaluateOnNewDocument(pointerTracker).catch(error => {
            console.log('Failed to inject pointer tracker');
        });
    }
}

const pointerTracker = () => {
    // Install mouse helper only for top-level frame.
    if (window !== window.parent)
        return;
    window.addEventListener('DOMContentLoaded', () => {
        const box = document.createElement('automation-mouse-pointer');
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
      automation-mouse-pointer {
        pointer-events: none;
        position: absolute;
        top: 0;
        z-index: 10000;
        left: 0;
        width: 20px;
        height: 20px;
        background: rgba(0,0,0,.4);
        border: 1px solid white;
        border-radius: 10px;
        margin: -10px 0 0 -10px;
        padding: 0;
        transition: background .2s, border-radius .2s, border-color .2s;
      }
      automation-mouse-pointer.button-1 {
        transition: none;
        background: rgba(0,0,0,0.9);
      }
      automation-mouse-pointer.button-2 {
        transition: none;
        border-color: rgba(0,0,255,0.9);
      }
      automation-mouse-pointer.button-3 {
        transition: none;
        border-radius: 4px;
      }
      automation-mouse-pointer.button-4 {
        transition: none;
        border-color: rgba(255,0,0,0.9);
      }
      automation-mouse-pointer.button-5 {
        transition: none;
        border-color: rgba(0,255,0,0.9);
      }
    `;
        document.head.appendChild(styleElement);
        document.body.appendChild(box);
        document.addEventListener('mousemove', event => {
            box.style.left = `${event.pageX}px`;
            box.style.top = `${event.pageY}px`;
            updateButtons(event.buttons);
        }, true);
        document.addEventListener('mousedown', event => {
            updateButtons(event.buttons);
            box.classList.add(`button-${event.which}`);
        }, true);
        document.addEventListener('mouseup', event => {
            updateButtons(event.buttons);
            box.classList.remove(`button-${event.which}`);
        }, true);
        function updateButtons(buttons) {
            for (let i = 0; i < 5; i++)
                box.classList.toggle(`button-${i}`, buttons & (1 << i));
        }
    }, false);
};

module.exports = {trackPointer};
