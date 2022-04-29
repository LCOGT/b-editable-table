'use strict';var bootstrapVue=require('bootstrap-vue'),Vue=require('vue');function _interopDefaultLegacy(e){return e&&typeof e==='object'&&'default'in e?e:{'default':e}}var Vue__default=/*#__PURE__*/_interopDefaultLegacy(Vue);function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      _defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;

  var _s, _e;

  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}var script = Vue__default["default"].extend({
  name: "BEditableTable",
  components: {
    BTable: bootstrapVue.BTable,
    BFormDatepicker: bootstrapVue.BFormDatepicker,
    BFormInput: bootstrapVue.BFormInput,
    BFormSelect: bootstrapVue.BFormSelect,
    BFormCheckbox: bootstrapVue.BFormCheckbox,
    BFormRating: bootstrapVue.BFormRating,
    BTooltip: bootstrapVue.BTooltip
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
      inserted: function inserted(el, event) {
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
      bind: function bind(el, binding, vnode) {
        el.clickOutsideEvent = function (event) {
          if (!(el == event.target || el.contains(event.target))) {
            if (document.contains(event.target)) {
              vnode.context[binding.expression](event);
            }
          }
        };

        document.addEventListener("click", el.clickOutsideEvent);
      },
      unbind: function unbind(el) {
        document.removeEventListener("click", el.clickOutsideEvent);
      }
    }
  },
  data: function data() {
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
  mounted: function mounted() {
    this.editMode = this.editMode;
    this.createTableItems(this.value ? this.value : this.items);
  },
  watch: {
    value: function value(newVal) {
      this.createTableItems(newVal);
    },
    items: function items(newVal) {
      this.createTableItems(newVal);
    },
    rowUpdate: {
      handler: function handler(newVal) {
        if (this.tableMap[newVal.id]) {
          this.tableMap[newVal.id].isEdit = newVal.edit;
        }

        if (newVal.action === "update") {
          this.clearValidation(newVal.id);
          this.updateData(newVal.id);
        } else if (newVal.action === "add") {
          this.updateData(newVal.id, "add", _objectSpread2({}, newVal.data), newVal.edit);
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
    handleEditCell: function handleEditCell(e, id, name, editable) {
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
    clearValidation: function clearValidation(id) {
      // Clear validation for the selected row
      for (var key in this.tableMap[id].fields) {
        this.tableMap[id].fields[key].validity = {
          valid: true
        };
      }
    },
    handleKeydown: function handleKeydown(e, index, data) {
      if ((e.code === "Tab" || e.code === "Enter") && this.editMode === "cell" && !this.disableDefaultEdit) {
        var _this$tableItems$rowI;

        e.preventDefault();
        var fieldIndex = this.fields.length - 1 === index ? 0 : index + 1;
        var rowIndex = this.fields.length - 1 === index ? data.index + 1 : data.index;
        var i = fieldIndex; // Find next editable field

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
        var rowId = (_this$tableItems$rowI = this.tableItems[rowIndex]) === null || _this$tableItems$rowI === void 0 ? void 0 : _this$tableItems$rowI.id;

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
    handleClickOut: function handleClickOut() {
      if (!this.disableDefaultEdit) {
        this.selectedCell = null;
        this.clearEditMode();
        this.updateData();
      }
    },
    inputHandler: function inputHandler(value, data, key, options) {
      var changedValue = value; // Handle select element with options

      if (options) {
        var selectedValue = options.find(function (item) {
          return item.value === value;
        });
        changedValue = selectedValue ? selectedValue.value : value;
      }

      var validity = data.field.validate ? data.field.validate(changedValue) : {
        valid: true
      };
      var fields = this.tableMap[data.item.id].fields;
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

      var fieldType = data.field.type;
      var excludeTypes = {
        text: true,
        range: true,
        number: true
      };

      if (!excludeTypes[fieldType]) {
        this.$emit("input-change", _objectSpread2(_objectSpread2({}, data), {}, {
          id: data.item.id,
          value: changedValue,
          validity: _objectSpread2({}, fields[key].validity)
        }));
      }
    },
    changeHandler: function changeHandler(value, data, key) {
      this.$emit("input-change", _objectSpread2(_objectSpread2({}, data), {}, {
        id: data.item.id,
        value: value,
        validity: _objectSpread2({}, this.tableMap[data.item.id].fields[key].validity)
      }));
    },
    updateData: function updateData(id, action, data, isEdit) {
      var _this = this;

      var isUpdate = false;
      var objId = id ? id : Object.keys(this.localChanges)[0];

      if (action === "add") {
        // Stop editing any cells before adding a new row
        this.tableItems = this.tableItems.map(function (item) {
          return _objectSpread2(_objectSpread2({}, item), {}, {
            isEdit: false
          });
        });
        isUpdate = true; // Warning: if watcher don't trigger the new row will not update the tableMap properly

        this.tableMap[id] = {
          id: id,
          isEdit: isEdit,
          fields: {}
        };
        this.tableItems.push(data);
      } else if (action === "delete") {
        // Stop editing any cells before adding a new row
        this.tableItems = this.tableItems.map(function (item) {
          return _objectSpread2(_objectSpread2({}, item), {}, {
            isEdit: false
          });
        });
        isUpdate = true;
        delete this.tableMap[id];
        this.tableItems = this.tableItems.filter(function (item) {
          return item.id !== id;
        });
      } else {
        var objValue = id ? this.localChanges[id] : Object.values(this.localChanges)[0]; // If v-model is set then emit updated table

        if (this.value && objValue) {
          Object.keys(objValue).forEach(function (key) {
            isUpdate = true;
            var cell = objValue[key];
            _this.tableMap[objId].fields[key].value = cell.value;
            _this.tableItems[cell.rowIndex][key] = cell.value;
          });
        }
      }

      if (isUpdate) {
        this.$emit("input", this.tableItems);
      }

      delete this.localChanges[id ? id : objId];
    },
    handleListeners: function handleListeners(listeners) {
      // Exclude listeners that are not part of Bootstrap Vue
      var excludeEvents = {
        input: true,
        "input-change": true
      };
      return Object.keys(listeners).reduce(function (a, c) {
        return excludeEvents[c] ? a : _objectSpread2(_objectSpread2({}, a), {}, _defineProperty({}, c, listeners[c]));
      }, {});
    },
    getCellValue: function getCellValue(data, field) {
      var row = this.tableMap[data.item.id];
      var value = row && row.fields[field.key] ? row.fields[field.key].value : ""; // Handle select element with options

      if (data.field.options) {
        var selectedValue = data.field.options.find(function (item) {
          return item.value === value;
        });
        value = selectedValue ? selectedValue.text : value;
      }

      return value;
    },
    getCellData: function getCellData(data) {
      return _objectSpread2(_objectSpread2({}, data), {}, {
        isEdit: this.tableMap[data.item.id].isEdit,
        id: data.item.id
      });
    },
    getValidity: function getValidity(data, field) {
      return this.tableMap[data.item.id].fields[field.key].validity;
    },
    showField: function showField(field, data, type) {
      var _this$tableMap$data$i;

      return field.type === type && ((_this$tableMap$data$i = this.tableMap[data.item.id]) === null || _this$tableMap$data$i === void 0 ? void 0 : _this$tableMap$data$i.isEdit) && (this.selectedCell === field.key || this.editMode === "row") && field.editable;
    },
    getFieldValue: function getFieldValue(field, data) {
      var _this$tableMap$data$i2;

      return (_this$tableMap$data$i2 = this.tableMap[data.item.id].fields[field.key]) === null || _this$tableMap$data$i2 === void 0 ? void 0 : _this$tableMap$data$i2.value;
    },
    enableFocus: function enableFocus(type) {
      return this.editMode === "cell" ? type : false;
    },
    clearEditMode: function clearEditMode(id) {
      if (id) {
        this.tableMap[id].isEdit = false;
      } else {
        for (var changeId in this.localChanges) {
          this.tableMap[changeId].isEdit = false;
        }
      }
    },
    createTableItems: function createTableItems(data) {
      var _this2 = this;

      this.tableItems = data.map(function (item) {
        return _objectSpread2({}, item);
      });
      this.tableMap = data.reduce(function (rows, curRow) {
        return _objectSpread2(_objectSpread2({}, rows), {}, _defineProperty({}, curRow.id, {
          id: curRow.id,
          isEdit: _this2.tableMap[curRow.id] ? _this2.tableMap[curRow.id].isEdit : false,
          fields: Object.keys(curRow).reduce(function (keys, curKey) {
            var _this2$tableMap$curRo, _this2$tableMap$curRo2;

            return _objectSpread2(_objectSpread2({}, keys), {}, _defineProperty({}, curKey, {
              value: curRow[curKey],
              validity: (_this2$tableMap$curRo = _this2.tableMap[curRow.id]) !== null && _this2$tableMap$curRo !== void 0 && (_this2$tableMap$curRo2 = _this2$tableMap$curRo.fields[curKey]) !== null && _this2$tableMap$curRo2 !== void 0 && _this2$tableMap$curRo2.validity ? _this2.tableMap[curRow.id].fields[curKey].validity : {
                valid: true
              }
            }));
          }, {})
        }));
      }, {});
    }
  }
});function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
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
}function createInjectorSSR(context) {
    if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
    }
    if (!context)
        return () => { };
    if (!('styles' in context)) {
        context._styles = context._styles || {};
        Object.defineProperty(context, 'styles', {
            enumerable: true,
            get: () => context._renderStyles(context._styles)
        });
        context._renderStyles = context._renderStyles || renderStyles;
    }
    return (id, style) => addStyle(id, style, context);
}
function addStyle(id, css, context) {
    const group = css.media || 'default' ;
    const style = context._styles[group] || (context._styles[group] = { ids: [], css: '' });
    if (!style.ids.includes(id)) {
        style.media = css.media;
        style.ids.push(id);
        let code = css.source;
        style.css += code + '\n';
    }
}
function renderStyles(styles) {
    let css = '';
    for (const key in styles) {
        const style = styles[key];
        css +=
            '<style data-vue-ssr-id="' +
                Array.from(style.ids).join(' ') +
                '"' +
                (style.media ? ' media="' + style.media + '"' : '') +
                '>' +
                style.css +
                '</style>';
    }
    return css;
}/* script */
var __vue_script__ = script;
/* template */

var __vue_render__ = function __vue_render__() {
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
        fn: function fn(scope) {
          return [_vm._t(slot, null, null, scope)];
        }
      };
    }), _vm._l(_vm.fields, function (field, index) {
      return {
        key: "cell(" + field.key + ")",
        fn: function fn(data) {
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
              "input": function input(value) {
                return _vm.inputHandler(value, data, field.key);
              }
            },
            nativeOn: {
              "keydown": function keydown($event) {
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
              "change": function change(value) {
                return _vm.inputHandler(value, data, field.key, field.options);
              }
            },
            nativeOn: {
              "keydown": function keydown($event) {
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
              "change": function change(value) {
                return _vm.inputHandler(value, data, field.key);
              }
            },
            nativeOn: {
              "keydown": function keydown($event) {
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
              "change": function change(value) {
                return _vm.inputHandler(value, data, field.key);
              }
            },
            nativeOn: {
              "keydown": function keydown($event) {
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
              "keydown": function keydown($event) {
                return _vm.handleKeydown($event, index, data);
              },
              "input": function input(value) {
                return _vm.inputHandler(value, data, field.key);
              },
              "change": function change(value) {
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

var __vue_inject_styles__ = function __vue_inject_styles__(inject) {
  if (!inject) return;
  inject("data-v-75ac0be2_0", {
    source: ".bootstrap-vue-editable-table[data-v-75ac0be2]{width:unset}.bootstrap-vue-editable-table[data-v-75ac0be2] td{padding:0}.data-cell[data-v-75ac0be2]{display:flex;width:100%;height:100%}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


var __vue_scope_id__ = "data-v-75ac0be2";
/* module identifier */

var __vue_module_identifier__ = "data-v-75ac0be2";
/* functional template */

var __vue_is_functional_template__ = false;
/* style inject shadow dom */

var __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, undefined, createInjectorSSR, undefined);

var component$1 = __vue_component__;// Import vue component

// Default export is installable instance of component.
// IIFE injects install function into component, allowing component
// to be registered via Vue.use() as well as Vue.component(),
var component = /*#__PURE__*/(function () {
  // Assign InstallableComponent type
  var installable = component$1; // Attach install function executed by Vue.use()

  installable.install = function (Vue) {
    Vue.component('BEditableTable', installable);
  };

  return installable;
})(); // It's possible to expose named exports when writing components that can
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = directive;
var namedExports=/*#__PURE__*/Object.freeze({__proto__:null,'default':component});// only expose one global var, with named exports exposed as properties of
// that global var (eg. plugin.namedExport)

Object.entries(namedExports).forEach(function (_ref) {
  var _ref2 = _slicedToArray(_ref, 2),
      exportName = _ref2[0],
      exported = _ref2[1];

  if (exportName !== 'default') component[exportName] = exported;
});module.exports=component;