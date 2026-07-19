window.LunaLoaders = {
  currentLoader: 'banter',
  currentColor: 'rgba(200, 200, 200, 0.7)', // default gray color
  templates: {
    'three-box': {
       html: `<div class="loader-wrap" style="width: 24px; height: 24px; position: relative;"><div class="loader" style="transform: scale(0.21); transform-origin: top left; position: absolute; top: 0; left: 0;"><div class="box1"></div><div class="box2"></div><div class="box3"></div></div></div>`
    },
    'banter': {
       html: `<div class="loader-wrap" style="width: 24px; height: 24px; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;"><div class="banter-loader" style="transform: scale(0.33) translate(-10px, -10px); transform-origin: center;"><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div><div class="banter-loader__box"></div></div></div>`
    }
  },
  getLoaderHtml: function(isTyping = false) {
    const template = this.templates[this.currentLoader].html;
    if (isTyping) {
        return `<div style="display: flex; align-items: center; gap: 10px; --loader-color: ${this.currentColor};">${template}<span id="luna-typing" style="font-style:italic;color:var(--dim);">Luna is thinking... <span id="luna-typing-timer" style="font-family:monospace;font-size:0.8rem;">[0.0s]</span></span></div>`;
    }
    return `<div style="display: inline-flex; align-items: center; gap: 8px; --loader-color: ${this.currentColor}; margin-right: 2px;">${template}Luna is thinking...</div>`;
  }
};
