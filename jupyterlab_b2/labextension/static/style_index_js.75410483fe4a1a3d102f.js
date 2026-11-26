"use strict";
(self["webpackChunkjupyterlab_b2"] = self["webpackChunkjupyterlab_b2"] || []).push([["style_index_js"],{

/***/ "./node_modules/css-loader/dist/cjs.js!./style/base.css"
/*!**************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./style/base.css ***!
  \**************************************************************/
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/getUrl.js */ "./node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
// Imports



var ___CSS_LOADER_URL_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(/*! data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23616161%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27%23616161%27 stroke-width=%271.5%27/%3E%3C/svg%3E */ "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23616161%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27%23616161%27 stroke-width=%271.5%27/%3E%3C/svg%3E"), __webpack_require__.b);
var ___CSS_LOADER_URL_IMPORT_1___ = new URL(/* asset import */ __webpack_require__(/*! data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27white%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27white%27 stroke-width=%271.5%27/%3E%3C/svg%3E */ "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27white%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27white%27 stroke-width=%271.5%27/%3E%3C/svg%3E"), __webpack_require__.b);
var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_0___);
var ___CSS_LOADER_URL_REPLACEMENT_1___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_1___);
// Module
___CSS_LOADER_EXPORT___.push([module.id, `/* B2 JupyterLab Extension — Sidebar Styles */

/*
 * Bucket icon for root-level directories in the B2 file browser.
 * At root level, each "folder" is actually a B2 bucket.
 *
 * DOM structure (from inspect):
 *   <span class="jp-DirListing-itemIcon ...">
 *     <svg data-icon="ui-components:folder">
 *       <path class="jp-icon3 jp-icon-selectable" d="M10 4H4c..."/>
 *     </svg>
 *   </span>
 *
 * We replace the folder path with a bucket shape path.
 */

/* Hide the default folder SVG path at root level */
#jupyterlab-b2-browser[data-b2-root="true"] .jp-DirListing-item[data-isdir="true"] .jp-DirListing-itemIcon svg[data-icon="ui-components:folder"] {
  display: none !important;
}

/* Show bucket icon as background on the icon span — grey for unselected */
#jupyterlab-b2-browser[data-b2-root="true"] .jp-DirListing-item[data-isdir="true"] .jp-DirListing-itemIcon {
  background-image: url(${___CSS_LOADER_URL_REPLACEMENT_0___}) !important;
  background-size: 16px 16px !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  min-width: 20px !important;
  min-height: 20px !important;
  display: inline-block !important;
}

/* White bucket icon when selected (matching JupyterLab's folder icon behavior) */
#jupyterlab-b2-browser[data-b2-root="true"] .jp-DirListing-item.jp-mod-selected[data-isdir="true"] .jp-DirListing-itemIcon {
  background-image: url(${___CSS_LOADER_URL_REPLACEMENT_1___}) !important;
}

/*
 * Context menu filtering when B2 file browser is active.
 * Hide everything that doesn't apply to B2 cloud storage.
 * Keep only: New Folder (becomes "Create Bucket" at root), Delete, Rename.
 */
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:create-new-directory"],
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:create-new-file"],
body.b2-browser-active .lm-Menu-item[data-command="fileeditor:create-new"],
body.b2-browser-active .lm-Menu-item[data-command="fileeditor:create-new-python-file"],
body.b2-browser-active .lm-Menu-item[data-command="fileeditor:create-new-r-file"],
body.b2-browser-active .lm-Menu-item[data-command="fileeditor:create-new-markdown-file"],
body.b2-browser-active .lm-Menu-item[data-command="notebook:create-new"],
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:paste"],
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:copy-path"],
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:copy"],
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:cut"],
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:duplicate"],
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:share-main"],
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:copy-download-link"],
body.b2-browser-active .lm-Menu-item[data-command="docmanager:open-browser-tab"],
body.b2-browser-active .lm-Menu-item[data-command="filebrowser:delete"] {
  display: none !important;
}

/* Upload status indicator animation */
@keyframes b2-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.b2-upload-status {
  transition: all 0.3s ease;
}

.b2-browser-widget {
  overflow-y: auto;
  font-size: 13px;
}

.b2-panel {
  padding: 12px;
}

.b2-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--jp-border-color1);
}

.b2-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  flex: 1;
}

.b2-subtitle {
  margin: 0;
  font-size: 11px;
  color: var(--jp-ui-font-color2);
}

/* Auth form */
.b2-auth-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.b2-auth-form label {
  font-size: 11px;
  font-weight: 600;
  color: var(--jp-ui-font-color1);
  margin-top: 4px;
}

.b2-input {
  padding: 6px 8px;
  border: 1px solid var(--jp-border-color1);
  border-radius: 4px;
  background: var(--jp-layout-color1);
  color: var(--jp-ui-font-color0);
  font-size: 12px;
  font-family: var(--jp-code-font-family);
}

.b2-input:focus {
  outline: none;
  border-color: var(--jp-brand-color1);
  box-shadow: 0 0 0 2px var(--jp-brand-color3);
}

.b2-hint {
  font-size: 10px;
  color: var(--jp-ui-font-color2);
  margin-top: 8px;
  line-height: 1.4;
}

.b2-hint code {
  font-size: 10px;
  background: var(--jp-layout-color2);
  padding: 1px 3px;
  border-radius: 2px;
}

/* Buttons */
.b2-btn {
  cursor: pointer;
  border: 1px solid var(--jp-border-color1);
  border-radius: 4px;
  background: var(--jp-layout-color1);
  color: var(--jp-ui-font-color0);
  font-size: 12px;
  padding: 6px 12px;
  transition: background 0.15s;
}

.b2-btn:hover {
  background: var(--jp-layout-color2);
}

.b2-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.b2-btn-primary {
  background: var(--jp-brand-color1);
  color: white;
  border-color: var(--jp-brand-color1);
}

.b2-btn-primary:hover {
  background: var(--jp-brand-color0);
}

.b2-btn-sm {
  padding: 3px 8px;
  font-size: 14px;
  line-height: 1;
  min-width: 28px;
  text-align: center;
}

.b2-btn-xs {
  padding: 2px 6px;
  font-size: 12px;
  line-height: 1;
  border: none;
  background: transparent;
}

.b2-btn-xs:hover {
  background: var(--jp-layout-color2);
  border-radius: 3px;
}

/* List items */
.b2-list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
}

.b2-list-item:hover {
  background: var(--jp-layout-color2);
}

.b2-icon {
  font-size: 16px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.b2-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}

.b2-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--jp-layout-color3);
  color: var(--jp-ui-font-color2);
  white-space: nowrap;
}

/* File item specifics */
.b2-file-item {
  align-items: flex-start;
}

.b2-file-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.b2-meta {
  font-size: 10px;
  color: var(--jp-ui-font-color2);
}

.b2-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.b2-file-item:hover .b2-actions {
  opacity: 1;
}

/* Breadcrumbs */
.b2-breadcrumbs {
  flex: 1;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.b2-breadcrumb-item {
  cursor: pointer;
  color: var(--jp-brand-color1);
}

.b2-breadcrumb-item:hover {
  text-decoration: underline;
}

.b2-breadcrumb-item:last-child {
  color: var(--jp-ui-font-color0);
  font-weight: 600;
  cursor: default;
}

.b2-breadcrumb-item:last-child:hover {
  text-decoration: none;
}

/* Status messages */
.b2-loading {
  text-align: center;
  padding: 20px;
  color: var(--jp-ui-font-color2);
}

.b2-empty {
  text-align: center;
  padding: 20px;
  color: var(--jp-ui-font-color2);
  font-style: italic;
}

.b2-error {
  color: var(--jp-error-color1);
  font-size: 12px;
}

.b2-status-msg {
  min-height: 18px;
  font-size: 12px;
}

/* Action bar */
.b2-action-bar {
  padding: 8px 0;
  margin-top: 8px;
  border-top: 1px solid var(--jp-border-color2);
  display: flex;
  gap: 6px;
}

.b2-btn-full {
  width: 100%;
  text-align: center;
}
`, "",{"version":3,"sources":["webpack://./style/base.css"],"names":[],"mappings":"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","sourcesContent":["/* B2 JupyterLab Extension — Sidebar Styles */\n\n/*\n * Bucket icon for root-level directories in the B2 file browser.\n * At root level, each \"folder\" is actually a B2 bucket.\n *\n * DOM structure (from inspect):\n *   <span class=\"jp-DirListing-itemIcon ...\">\n *     <svg data-icon=\"ui-components:folder\">\n *       <path class=\"jp-icon3 jp-icon-selectable\" d=\"M10 4H4c...\"/>\n *     </svg>\n *   </span>\n *\n * We replace the folder path with a bucket shape path.\n */\n\n/* Hide the default folder SVG path at root level */\n#jupyterlab-b2-browser[data-b2-root=\"true\"] .jp-DirListing-item[data-isdir=\"true\"] .jp-DirListing-itemIcon svg[data-icon=\"ui-components:folder\"] {\n  display: none !important;\n}\n\n/* Show bucket icon as background on the icon span — grey for unselected */\n#jupyterlab-b2-browser[data-b2-root=\"true\"] .jp-DirListing-item[data-isdir=\"true\"] .jp-DirListing-itemIcon {\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23616161' d='M5 8h14l-1.5 11H6.5L5 8Z'/%3E%3Cellipse cx='12' cy='6.5' rx='8' ry='1.5' fill='none' stroke='%23616161' stroke-width='1.5'/%3E%3C/svg%3E\") !important;\n  background-size: 16px 16px !important;\n  background-position: center !important;\n  background-repeat: no-repeat !important;\n  min-width: 20px !important;\n  min-height: 20px !important;\n  display: inline-block !important;\n}\n\n/* White bucket icon when selected (matching JupyterLab's folder icon behavior) */\n#jupyterlab-b2-browser[data-b2-root=\"true\"] .jp-DirListing-item.jp-mod-selected[data-isdir=\"true\"] .jp-DirListing-itemIcon {\n  background-image: url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M5 8h14l-1.5 11H6.5L5 8Z'/%3E%3Cellipse cx='12' cy='6.5' rx='8' ry='1.5' fill='none' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E\") !important;\n}\n\n/*\n * Context menu filtering when B2 file browser is active.\n * Hide everything that doesn't apply to B2 cloud storage.\n * Keep only: New Folder (becomes \"Create Bucket\" at root), Delete, Rename.\n */\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:create-new-directory\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:create-new-file\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"fileeditor:create-new\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"fileeditor:create-new-python-file\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"fileeditor:create-new-r-file\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"fileeditor:create-new-markdown-file\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"notebook:create-new\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:paste\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:copy-path\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:copy\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:cut\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:duplicate\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:share-main\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:copy-download-link\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"docmanager:open-browser-tab\"],\nbody.b2-browser-active .lm-Menu-item[data-command=\"filebrowser:delete\"] {\n  display: none !important;\n}\n\n/* Upload status indicator animation */\n@keyframes b2-pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.6; }\n}\n\n.b2-upload-status {\n  transition: all 0.3s ease;\n}\n\n.b2-browser-widget {\n  overflow-y: auto;\n  font-size: 13px;\n}\n\n.b2-panel {\n  padding: 12px;\n}\n\n.b2-header {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  margin-bottom: 12px;\n  padding-bottom: 8px;\n  border-bottom: 1px solid var(--jp-border-color1);\n}\n\n.b2-header h3 {\n  margin: 0;\n  font-size: 14px;\n  font-weight: 600;\n  flex: 1;\n}\n\n.b2-subtitle {\n  margin: 0;\n  font-size: 11px;\n  color: var(--jp-ui-font-color2);\n}\n\n/* Auth form */\n.b2-auth-form {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.b2-auth-form label {\n  font-size: 11px;\n  font-weight: 600;\n  color: var(--jp-ui-font-color1);\n  margin-top: 4px;\n}\n\n.b2-input {\n  padding: 6px 8px;\n  border: 1px solid var(--jp-border-color1);\n  border-radius: 4px;\n  background: var(--jp-layout-color1);\n  color: var(--jp-ui-font-color0);\n  font-size: 12px;\n  font-family: var(--jp-code-font-family);\n}\n\n.b2-input:focus {\n  outline: none;\n  border-color: var(--jp-brand-color1);\n  box-shadow: 0 0 0 2px var(--jp-brand-color3);\n}\n\n.b2-hint {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2);\n  margin-top: 8px;\n  line-height: 1.4;\n}\n\n.b2-hint code {\n  font-size: 10px;\n  background: var(--jp-layout-color2);\n  padding: 1px 3px;\n  border-radius: 2px;\n}\n\n/* Buttons */\n.b2-btn {\n  cursor: pointer;\n  border: 1px solid var(--jp-border-color1);\n  border-radius: 4px;\n  background: var(--jp-layout-color1);\n  color: var(--jp-ui-font-color0);\n  font-size: 12px;\n  padding: 6px 12px;\n  transition: background 0.15s;\n}\n\n.b2-btn:hover {\n  background: var(--jp-layout-color2);\n}\n\n.b2-btn:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n\n.b2-btn-primary {\n  background: var(--jp-brand-color1);\n  color: white;\n  border-color: var(--jp-brand-color1);\n}\n\n.b2-btn-primary:hover {\n  background: var(--jp-brand-color0);\n}\n\n.b2-btn-sm {\n  padding: 3px 8px;\n  font-size: 14px;\n  line-height: 1;\n  min-width: 28px;\n  text-align: center;\n}\n\n.b2-btn-xs {\n  padding: 2px 6px;\n  font-size: 12px;\n  line-height: 1;\n  border: none;\n  background: transparent;\n}\n\n.b2-btn-xs:hover {\n  background: var(--jp-layout-color2);\n  border-radius: 3px;\n}\n\n/* List items */\n.b2-list-item {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  padding: 6px 8px;\n  border-radius: 4px;\n  cursor: pointer;\n  transition: background 0.1s;\n}\n\n.b2-list-item:hover {\n  background: var(--jp-layout-color2);\n}\n\n.b2-icon {\n  font-size: 16px;\n  flex-shrink: 0;\n  width: 20px;\n  text-align: center;\n}\n\n.b2-name {\n  flex: 1;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  font-size: 12px;\n}\n\n.b2-badge {\n  font-size: 10px;\n  padding: 1px 6px;\n  border-radius: 8px;\n  background: var(--jp-layout-color3);\n  color: var(--jp-ui-font-color2);\n  white-space: nowrap;\n}\n\n/* File item specifics */\n.b2-file-item {\n  align-items: flex-start;\n}\n\n.b2-file-info {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  overflow: hidden;\n}\n\n.b2-meta {\n  font-size: 10px;\n  color: var(--jp-ui-font-color2);\n}\n\n.b2-actions {\n  display: flex;\n  gap: 2px;\n  opacity: 0;\n  transition: opacity 0.15s;\n}\n\n.b2-file-item:hover .b2-actions {\n  opacity: 1;\n}\n\n/* Breadcrumbs */\n.b2-breadcrumbs {\n  flex: 1;\n  font-size: 11px;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.b2-breadcrumb-item {\n  cursor: pointer;\n  color: var(--jp-brand-color1);\n}\n\n.b2-breadcrumb-item:hover {\n  text-decoration: underline;\n}\n\n.b2-breadcrumb-item:last-child {\n  color: var(--jp-ui-font-color0);\n  font-weight: 600;\n  cursor: default;\n}\n\n.b2-breadcrumb-item:last-child:hover {\n  text-decoration: none;\n}\n\n/* Status messages */\n.b2-loading {\n  text-align: center;\n  padding: 20px;\n  color: var(--jp-ui-font-color2);\n}\n\n.b2-empty {\n  text-align: center;\n  padding: 20px;\n  color: var(--jp-ui-font-color2);\n  font-style: italic;\n}\n\n.b2-error {\n  color: var(--jp-error-color1);\n  font-size: 12px;\n}\n\n.b2-status-msg {\n  min-height: 18px;\n  font-size: 12px;\n}\n\n/* Action bar */\n.b2-action-bar {\n  padding: 8px 0;\n  margin-top: 8px;\n  border-top: 1px solid var(--jp-border-color2);\n  display: flex;\n  gap: 6px;\n}\n\n.b2-btn-full {\n  width: 100%;\n  text-align: center;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ },

/***/ "./node_modules/css-loader/dist/runtime/api.js"
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
(module) {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ },

/***/ "./node_modules/css-loader/dist/runtime/getUrl.js"
/*!********************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/getUrl.js ***!
  \********************************************************/
(module) {



module.exports = function (url, options) {
  if (!options) {
    options = {};
  }
  if (!url) {
    return url;
  }
  url = String(url.__esModule ? url.default : url);

  // If url is already wrapped in quotes, remove them
  if (/^['"].*['"]$/.test(url)) {
    url = url.slice(1, -1);
  }
  if (options.hash) {
    url += options.hash;
  }

  // Should url be wrapped?
  // See https://drafts.csswg.org/css-values-3/#urls
  if (/["'() \t\n]|(%20)/.test(url) || options.needQuotes) {
    return "\"".concat(url.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n"), "\"");
  }
  return url;
};

/***/ },

/***/ "./node_modules/css-loader/dist/runtime/sourceMaps.js"
/*!************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \************************************************************/
(module) {



module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];
  if (!cssMapping) {
    return content;
  }
  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    return [content].concat([sourceMapping]).join("\n");
  }
  return [content].join("\n");
};

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js"
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
(module) {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js"
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
(module) {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js"
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
(module) {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js"
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js"
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
(module) {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ },

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js"
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
(module) {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ },

/***/ "./style/index.js"
/*!************************!*\
  !*** ./style/index.js ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _base_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.css */ "./style/base.css");



/***/ },

/***/ "./style/base.css"
/*!************************!*\
  !*** ./style/base.css ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./base.css */ "./node_modules/css-loader/dist/cjs.js!./style/base.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_base_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ },

/***/ "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23616161%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27%23616161%27 stroke-width=%271.5%27/%3E%3C/svg%3E"
/*!**************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23616161%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27%23616161%27 stroke-width=%271.5%27/%3E%3C/svg%3E ***!
  \**************************************************************************************************************************************************************************************************************************************************************************************************************************/
(module) {

module.exports = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27%23616161%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27%23616161%27 stroke-width=%271.5%27/%3E%3C/svg%3E";

/***/ },

/***/ "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27white%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27white%27 stroke-width=%271.5%27/%3E%3C/svg%3E"
/*!******************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27white%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27white%27 stroke-width=%271.5%27/%3E%3C/svg%3E ***!
  \******************************************************************************************************************************************************************************************************************************************************************************************************************/
(module) {

module.exports = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 viewBox=%270 0 24 24%27%3E%3Cpath fill=%27white%27 d=%27M5 8h14l-1.5 11H6.5L5 8Z%27/%3E%3Cellipse cx=%2712%27 cy=%276.5%27 rx=%278%27 ry=%271.5%27 fill=%27none%27 stroke=%27white%27 stroke-width=%271.5%27/%3E%3C/svg%3E";

/***/ }

}]);
//# sourceMappingURL=style_index_js.75410483fe4a1a3d102f.js.map
