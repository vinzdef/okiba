/**
 * @module Component
 * @description  Manages a DOM component, binds UI and recursively binds child components.
 * Can be extended or instantiated
 * @example
 * // ./components/Slider.js
 *
 * import Component from '@okiba/component'
 * import SliderControls from '@components/SliderControls'
 *
 * const ui = {
 *   slides: '.slide',
 * }
 *
 * const components = {
 *   controls: {
 *     selector: '.slider-controls', type: SliderControls, options: {big: true}
 *   }
 * }
 *
 * class Slider extends Component {
 *   constructor({el, options}) {
 *     super({el, ui, components, options})
 *
 *     this.ui.slides.forEach(
 *       slide => slide.style.opacity = 0
 *     )
 *
 *     this.components.controls.forEach(
 *       controls => controls.onNext(this.next.bind(this))
 *     )
 *   }
 * }
 *
 * @example
 * // ./main.js
 *
 * import {qs} from '@okiba/dom'
 * import Component from '@okiba/component'
 * import Slider from './components/Slider'
 *
 * const app = new Component({
 *   el: qs('#app'),
 *   components: {
 *     selector: '.slider', type: Slider
 *   }
 * })
 */
import {qsa} from '@okiba/dom'
import {arrayOrOne} from '@okiba/arrays'

function bindUi(ui, el) {
  return Object.keys(ui).reduce(
    (hash, key) => {
      const els = arrayOrOne(qsa(ui[key].selector || ui[key], el))

      if (els) {
        hash[key] = els
      } else if (!ui[key].optional) {
        throw new Error(`[!!] [Component] Cant't find UI element for selector: ${ui[key]}`)
      }

      return hash
    }, {}
  )
}

function bindComponents(components, el) {
  return Object.keys(components).reduce(
    (hash, key) => {
      const {type, selector, options, optional} = components[key]

      if (typeof selector !== 'string' || !type) {
        throw new Error(`[!!] [Component] Invalid component configuration for key: ${key}`)
      }

      const els = arrayOrOne(qsa(selector, el))
      if (els) {
        hash[key] = Array.isArray(els)
          ? els.map(n => new type({el: n, options}))
          : new type({el: els, options})
      } else if (!optional) {
        throw new Error(`[!!] [Component] Cant't find node with selector ${selector} for sub-component: ${key}`)
      }

      return hash
    }, {}
  )
}

/**
 * Accepts an __hash__ whose properties can be:
 * @param {Object} args Arguments to create a component
 * @param   {Element}   {el}       DOM Element to be bound
 * @param   {Object}    [{ui}]
 * UI hash where keys are name and values are selectors
 * ```javascript
 * { buttonNext: '#buttonNext' }
 * ```
 * Becomes:
 * ```javascript
 * this.ui.buttonNext
 * ```
 *
 * @param   {Object}    [{components}]
 * Components hash for childs to bind, keys are names and values are component initialization props:
 * ```javascript
 * {
 *   slider: {
 *     // Matched using [qs]('https://github/okiba-gang/okiba/packages/dom'), scoped to the current component element
 *     selector: '.domSelector',
 *     // Component class, extending Okiba Component
 *     type: Slider,
 *     // Options hash
 *     options: {fullScreen: true}
 *   }
 * }
 * ```
 *
 * Becomes:
 * ```javascript
 * this.components.slider
 * ```
 * @param   {Object}    [{options}]         Custom options passed to the component
 */
class Component {
  constructor(args) {
    this.el = args.el

    if (args.options) {
      this.options = args.options
    }

    if (args.ui) {
      this.ui = bindUi(args.ui, args.el)
    }

    if (args.components) {
      this.components = bindComponents(args.components, args.el)
    }
  }

  /**
   * @function onDestroy
   * @description Virtual method, needs to be overridden
   * It's the place to call cleanup functions as it will
   * be called when your component is destroyed
   */

  /**
   * Should not be overridden, will call `onDestroy`
   * and forward destruction to all child components
   */
  destroy() {
    if (this.onDestroy) {
      this.onDestroy()
    }

    if (this.components) {
      Object.keys(this.components)
        .forEach(key => (this.components[key].length
          ? this.components[key]
          : [this.components[key]]
        ).forEach(
          c => c.destroy()
        ))
    }

    this.components = null
  }
}

export default Component
