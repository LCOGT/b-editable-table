import { BTable, BFormDatepicker, BFormInput, BFormSelect, BFormCheckbox, BFormRating, BTooltip } from 'bootstrap-vue';
import Vue from 'vue';

var script = Vue.extend({
  name: "BEditableTable",
  components: {
    BTable,
    BFormDatepicker,
    BFormInput,
    BFormSelect,
    BFormCheckbox,
    BFormRating,
    BTooltip
  },
  props: {
    fields: Array,
    items: Array,
    value: Array,
    editMode: {
      type: String,
      default: "cell"
    },
    editTrigger: {
      type: String,
      default: "click"
    },
    rowUpdate: {
      type: Object,
      default: null
    },
    disableDefaultEdit: {
      type: Boolean,
      default: false
    }
  },
  directives: {
    focus: {
      inserted: function (el, event) {
        switch (event.value) {
          case false:
            {
              return;
            }

          case "checkbox":
            el.children[0].focus();

          case "date":
            el.children[0].focus();

          default:
            el.focus();
        }
      }
    },
    clickOutside: {
      bind: function (el, binding, vnode) {
        el.clickOutsideEvent = function (event) {
          if (!(el == event.target || el.contains(event.target))) {
            if (document.contains(event.target)) {
              vnode.context[binding.expression](event);
            }
          }
        };

        document.addEventListener("click", el.clickOutsideEvent);
      },
      unbind: function (el) {
        document.removeEventListener("click", el.clickOutsideEvent);
      }
    }
  },

  data() {
    return {
      selectedCell: {
        type: String,
        default: null
      },
      tableItems: [],
      tableMap: {},
      localChanges: {}
    };
  },

  mounted() {
    this.editMode = this.editMode;
    this.createTableItems(this.value ? this.value : this.items);
  },

  watch: {
    value(newVal) {
      this.createTableItems(newVal);
    },

    items(newVal) {
      this.createTableItems(newVal);
    },

    rowUpdate: {
      handler(newVal) {
        if (this.tableMap[newVal.id]) {
          this.tableMap[newVal.id].isEdit = newVal.edit;
        }

        if (newVal.action === "update") {
          this.clearValidation(newVal.id);
          this.updateData(newVal.id);
        } else if (newVal.action === "add") {
          this.updateData(newVal.id, "add", { ...newVal.data
          }, newVal.edit);
        } else if (newVal.action === "delete") {
          this.updateData(newVal.id, "delete");
        } else if (newVal.action === "cancel" || newVal.isEdit === false) {
          this.clearValidation(newVal.id);
          delete this.localChanges[newVal.id];
        }
      },

      deep: true
    }
  },
  computed: {},
  methods: {
    handleEditCell(e, id, name, editable) {
      if (!this.disableDefaultEdit && editable) {
        e.stopPropagation();
        this.clearEditMode();
        this.updateData();
        this.tableMap[id].isEdit = true;
        this.selectedCell = name;
        this.clearValidation(id);

        if (!this.localChanges[id]) {
          this.localChanges[id] = {};
        }
      }
    },

    clearValidation(id) {
      // Clear validation for the selected row
      for (const key in this.tableMap[id].fields) {
        this.tableMap[id].fields[key].validity = {
          valid: true
        };
      }
    },

    handleKeydown(e, index, data) {
      if ((e.code === "Tab" || e.code === "Enter") && this.editMode === "cell" && !this.disableDefaultEdit) {
        var _this$tableItems$rowI;

        e.preventDefault();
        let fieldIndex = this.fields.length - 1 === index ? 0 : index + 1;
        let rowIndex = this.fields.length - 1 === index ? data.index + 1 : data.index;
        let i = fieldIndex; // Find next editable field

        while (!this.fields[i].editable) {
          if (i === this.fields.length - 1) {
            i = 0;
            rowIndex++;
          } else {
            i++;
          }
        }

        fieldIndex = i;
        this.selectedCell = this.fields[fieldIndex].key;
        this.clearEditMode(data.item.id);
        this.updateData(data.item.id);
        const rowId = (_this$tableItems$rowI = this.tableItems[rowIndex]) === null || _this$tableItems$rowI === void 0 ? void 0 : _this$tableItems$rowI.id;

        if (this.tableMap[rowId]) {
          this.tableMap[rowId].isEdit = true;

          if (!this.localChanges[rowId]) {
            this.localChanges[rowId] = {};
          }
        }
      } else if (e.code === "Escape") {
        e.preventDefault();
        this.selectedCell = null;
        this.clearEditMode(data.item.id);
        this.localChanges = {};
      }
    },

    handleClickOut() {
      if (!this.disableDefaultEdit) {
        this.selectedCell = null;
        this.clearEditMode();
        this.updateData();
      }
    },

    inputHandler(value, data, key, options) {
      let changedValue = value; // Handle select element with options

      if (options) {
        const selectedValue = options.find(item => item.value === value);
        changedValue = selectedValue ? selectedValue.value : value;
      }

      const validity = data.field.validate ? data.field.validate(changedValue) : {
        valid: true
      };
      const fields = this.tableMap[data.item.id].fields;
      fields[key].validity.valid = true;

      if (this.value && (!validity || (validity === null || validity === void 0 ? void 0 : validity.valid) === true)) {
        if (!this.localChanges[data.item.id]) {
          this.localChanges[data.item.id] = {};
        }

        this.localChanges[data.item.id][key] = {
          value: changedValue,
          rowIndex: data.index
        };
      } else {
        fields[key].validity = validity;
      }

      const fieldType = data.field.type;
      const excludeTypes = {
        text: true,
        range: true,
        number: true
      };

      if (!excludeTypes[fieldType]) {
        this.$emit("input-change", { ...data,
          id: data.item.id,
          value: changedValue,
          validity: { ...fields[key].validity
          }
        });
      }
    },

    changeHandler(value, data, key) {
      this.$emit("input-change", { ...data,
        id: data.item.id,
        value,
        validity: { ...this.tableMap[data.item.id].fields[key].validity
        }
      });
    },

    updateData(id, action, data, isEdit) {
      let isUpdate = false;
      const objId = id ? id : Object.keys(this.localChanges)[0];

      if (action === "add") {
        // Stop editing any cells before adding a new row
        this.tableItems = this.tableItems.map(item => ({ ...item,
          isEdit: false
        }));
        isUpdate = true; // Warning: if watcher don't trigger the new row will not update the tableMap properly

        this.tableMap[id] = {
          id,
          isEdit,
          fields: {}
        };
        this.tableItems.push(data);
      } else if (action === "delete") {
        // Stop editing any cells before adding a new row
        this.tableItems = this.tableItems.map(item => ({ ...item,
          isEdit: false
        }));
        isUpdate = true;
        delete this.tableMap[id];
        this.tableItems = this.tableItems.filter(item => item.id !== id);
      } else {
        const objValue = id ? this.localChanges[id] : Object.values(this.localChanges)[0]; // If v-model is set then emit updated table

        if (this.value && objValue) {
          Object.keys(objValue).forEach(key => {
            isUpdate = true;
            const cell = objValue[key];
            this.tableMap[objId].fields[key].value = cell.value;
            this.tableItems[cell.rowIndex][key] = cell.value;
          });
        }
      }

      if (isUpdate) {
        this.$emit("input", this.tableItems);
      }

      delete this.localChanges[id ? id : objId];
    },

    handleListeners(listeners) {
      // Exclude listeners that are not part of Bootstrap Vue
      const excludeEvents = {
        input: true,
        "input-change": true
      };
      return Object.keys(listeners).reduce((a, c) => excludeEvents[c] ? a : { ...a,
        [c]: listeners[c]
      }, {});
    },

    getCellValue(data, field) {
      const row = this.tableMap[data.item.id];
      let value = row && row.fields[field.key] ? row.fields[field.key].value : ""; // Handle select element with options

      if (data.field.options) {
        const selectedValue = data.field.options.find(item => item.value === value);
        value = selectedValue ? selectedValue.text : value;
      }

      return value;
    },

    getCellData(data) {
      return { ...data,
        isEdit: this.tableMap[data.item.id].isEdit,
        id: data.item.id
      };
    },

    getValidity(data, field) {
      return this.tableMap[data.item.id].fields[field.key].validity;
    },

    showField(field, data, type) {
      var _this$tableMap$data$i;

      return field.type === type && ((_this$tableMap$data$i = this.tableMap[data.item.id]) === null || _this$tableMap$data$i === void 0 ? void 0 : _this$tableMap$data$i.isEdit) && (this.selectedCell === field.key || this.editMode === "row") && field.editable;
    },

    getFieldValue(field, data) {
      var _this$tableMap$data$i2;

      return (_this$tableMap$data$i2 = this.tableMap[data.item.id].fields[field.key]) === null || _this$tableMap$data$i2 === void 0 ? void 0 : _this$tableMap$data$i2.value;
    },

    enableFocus(type) {
      return this.editMode === "cell" ? type : false;
    },

    clearEditMode(id) {
      if (id) {
        this.tableMap[id].isEdit = false;
      } else {
        for (const changeId in this.localChanges) {
          this.tableMap[changeId].isEdit = false;
        }
      }
    },

    createTableItems(data) {
      this.tableItems = data.map(item => ({ ...item
      }));
      this.tableMap = data.reduce((rows, curRow) => ({ ...rows,
        [curRow.id]: {
          id: curRow.id,
          isEdit: this.tableMap[curRow.id] ? this.tableMap[curRow.id].isEdit : false,
          fields: Object.keys(curRow).reduce((keys, curKey) => {
            var _this$tableMap$curRow, _this$tableMap$curRow2;

            return { ...keys,
              [curKey]: {
                value: curRow[curKey],
                validity: (_this$tableMap$curRow = this.tableMap[curRow.id]) !== null && _this$tableMap$curRow !== void 0 && (_this$tableMap$curRow2 = _this$tableMap$curRow.fields[curKey]) !== null && _this$tableMap$curRow2 !== void 0 && _this$tableMap$curRow2.validity ? this.tableMap[curRow.id].fields[curKey].validity : {
                  valid: true
                }
              }
            };
          }, {})
        }
      }), {});
    }

  }
});

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

const isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return (id, style) => addStyle(id, style);
}
let HEAD;
const styles = {};
function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        let code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                style.element.setAttribute('media', css.media);
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            const index = style.ids.size - 1;
            const textNode = document.createTextNode(code);
            const nodes = style.element.childNodes;
            if (nodes[index])
                style.element.removeChild(nodes[index]);
            if (nodes.length)
                style.element.insertBefore(textNode, nodes[index]);
            else
                style.element.appendChild(textNode);
        }
    }
}

/* script */
const __vue_script__ = script;
/* template */

var __vue_render__ = function () {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('b-table', _vm._g(_vm._b({
    directives: [{
      name: "click-outside",
      rawName: "v-click-outside",
      value: _vm.handleClickOut,
      expression: "handleClickOut"
    }],
    staticClass: "bootstrap-vue-editable-table",
    attrs: {
      "items": _vm.tableItems
    },
    scopedSlots: _vm._u([_vm._l(_vm.$scopedSlots, function (_, slot) {
      return {
        key: slot,
        fn: function (scope) {
          return [_vm._t(slot, null, null, scope)];
        }
      };
    }), _vm._l(_vm.fields, function (field, index) {
      return {
        key: "cell(" + field.key + ")",
        fn: function (data) {
          return [_vm.showField(field, data, 'date') ? _c('div', {
            key: index
          }, [_c('b-form-datepicker', _vm._b({
            directives: [{
              name: "focus",
              rawName: "v-focus",
              value: _vm.enableFocus('date'),
              expression: "enableFocus('date')"
            }],
            key: index,
            attrs: {
              "id": field.key + "-" + data.item.id,
              "type": field.type,
              "value": _vm.getFieldValue(field, data),
              "state": _vm.getValidity(data, field).valid ? null : false
            },
            on: {
              "input": function (value) {
                return _vm.inputHandler(value, data, field.key);
              }
            },
            nativeOn: {
              "keydown": function ($event) {
                return _vm.handleKeydown($event, index, data);
              }
            }
          }, 'b-form-datepicker', Object.assign({}, field), false)), _vm._v(" "), _vm.getValidity(data, field).errorMessage ? _c('b-tooltip', {
            attrs: {
              "target": field.key + "-" + data.item.id,
              "variant": "danger",
              "show": !_vm.getValidity(data, field).valid,
              "disabled": true
            }
          }, [_vm._v("\n        " + _vm._s(_vm.getValidity(data, field).errorMessage) + "\n      ")]) : _vm._e()], 1) : _vm.showField(field, data, 'select') ? _c('div', {
            key: index
          }, [_c('b-form-select', _vm._b({
            directives: [{
              name: "focus",
              rawName: "v-focus",
              value: _vm.enableFocus(),
              expression: "enableFocus()"
            }],
            attrs: {
              "id": field.key + "-" + data.item.id,
              "value": _vm.getFieldValue(field, data),
              "state": _vm.getValidity(data, field).valid ? null : false
            },
            on: {
              "change": function (value) {
                return _vm.inputHandler(value, data, field.key, field.options);
              }
            },
            nativeOn: {
              "keydown": function ($event) {
                return _vm.handleKeydown($event, index, data);
              }
            }
          }, 'b-form-select', Object.assign({}, field), false)), _vm._v(" "), _vm.getValidity(data, field).errorMessage ? _c('b-tooltip', {
            attrs: {
              "target": field.key + "-" + data.item.id,
              "variant": "danger",
              "show": !_vm.getValidity(data, field).valid,
              "disabled": true
            }
          }, [_vm._v("\n        " + _vm._s(_vm.getValidity(data, field).errorMessage) + "\n      ")]) : _vm._e()], 1) : _vm.showField(field, data, 'checkbox') ? _c('b-form-checkbox', _vm._b({
            directives: [{
              name: "focus",
              rawName: "v-focus",
              value: _vm.enableFocus('checkbox'),
              expression: "enableFocus('checkbox')"
            }],
            key: index,
            attrs: {
              "id": field.key + "-" + data.item.id,
              "checked": _vm.getFieldValue(field, data)
            },
            on: {
              "change": function (value) {
                return _vm.inputHandler(value, data, field.key);
              }
            },
            nativeOn: {
              "keydown": function ($event) {
                return _vm.handleKeydown($event, index, data);
              }
            }
          }, 'b-form-checkbox', Object.assign({}, field), false)) : _vm.showField(field, data, 'rating') ? _c('b-form-rating', _vm._b({
            directives: [{
              name: "focus",
              rawName: "v-focus",
              value: _vm.enableFocus(),
              expression: "enableFocus()"
            }],
            key: index,
            attrs: {
              "id": field.key + "-" + data.item.id,
              "value": _vm.getFieldValue(field, data)
            },
            on: {
              "change": function (value) {
                return _vm.inputHandler(value, data, field.key);
              }
            },
            nativeOn: {
              "keydown": function ($event) {
                return _vm.handleKeydown($event, index, data);
              }
            }
          }, 'b-form-rating', Object.assign({}, field), false)) : _vm.showField(field, data, field.type) ? _c('div', {
            key: index
          }, [_c('b-form-input', _vm._b({
            directives: [{
              name: "focus",
              rawName: "v-focus",
              value: _vm.enableFocus(),
              expression: "enableFocus()"
            }],
            attrs: {
              "id": field.key + "-" + data.item.id,
              "type": field.type,
              "value": _vm.getFieldValue(field, data),
              "state": _vm.getValidity(data, field).valid ? null : false
            },
            on: {
              "keydown": function ($event) {
                return _vm.handleKeydown($event, index, data);
              },
              "input": function (value) {
                return _vm.inputHandler(value, data, field.key);
              },
              "change": function (value) {
                return _vm.changeHandler(value, data, field.key);
              }
            }
          }, 'b-form-input', Object.assign({}, field), false)), _vm._v(" "), _vm.getValidity(data, field).errorMessage ? _c('b-tooltip', {
            attrs: {
              "target": field.key + "-" + data.item.id,
              "variant": "danger",
              "show": !_vm.getValidity(data, field).valid,
              "disabled": true
            }
          }, [_vm._v("\n        " + _vm._s(_vm.getValidity(data, field).errorMessage) + "\n      ")]) : _vm._e()], 1) : _c('div', {
            key: index,
            staticClass: "data-cell",
            on: _vm._d({}, [_vm.editTrigger, function ($event) {
              return _vm.handleEditCell($event, data.item.id, field.key, field.editable);
            }])
          }, [_vm.$scopedSlots["cell(" + field.key + ")"] ? _vm._t("cell(" + field.key + ")", null, null, _vm.getCellData(data)) : [_vm._v(_vm._s(_vm.getCellValue(data, field)))]], 2)];
        }
      };
    })], null, true)
  }, 'b-table', Object.assign({}, _vm.$props, _vm.$attrs), false), _vm.handleListeners(_vm.$listeners)));
};

var __vue_staticRenderFns__ = [];
/* style */

const __vue_inject_styles__ = function (inject) {
  if (!inject) return;
  inject("data-v-75ac0be2_0", {
    source: ".bootstrap-vue-editable-table[data-v-75ac0be2]{width:unset}.bootstrap-vue-editable-table[data-v-75ac0be2] td{padding:0}.data-cell[data-v-75ac0be2]{display:flex;width:100%;height:100%}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


const __vue_scope_id__ = "data-v-75ac0be2";
/* module identifier */

const __vue_module_identifier__ = undefined;
/* functional template */

const __vue_is_functional_template__ = false;
/* style inject SSR */

/* style inject shadow dom */

const __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, createInjector, undefined, undefined);

var component = __vue_component__;

// Import vue component

// Default export is installable instance of component.
// IIFE injects install function into component, allowing component
// to be registered via Vue.use() as well as Vue.component(),
var entry_esm = /*#__PURE__*/(() => {
  // Assign InstallableComponent type
  const installable = component; // Attach install function executed by Vue.use()

  installable.install = Vue => {
    Vue.component('BEditableTable', installable);
  };

  return installable;
})(); // It's possible to expose named exports when writing components that can
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = directive;

export { entry_esm as default };
