const fs = require('fs');
const path = require('path');

const rawUtils = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'node_modules', 'bootstrap.native', 'lib', 'V4', 'utils.js'));
const rawTooltip = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'node_modules', 'bootstrap.native', 'lib', 'V4', 'tooltip-native.js'));
const rawDropdown = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'node_modules', 'bootstrap.native', 'lib', 'V4', 'dropdown-native.js'));
const rawCollapse = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'node_modules', 'bootstrap.native', 'lib', 'V4', 'collapse-native.js'));

module.exports = () => {
  return {
    code: `
      "use strict";

      ${rawUtils};
      ${rawTooltip};
      ${rawDropdown};
      ${rawCollapse};

      export {
        Tooltip,
        Dropdown,
        Collapse
      };
    `,
    cacheable: true
  }
};
