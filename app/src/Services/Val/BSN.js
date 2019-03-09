const fs = require('fs');
const path = require('path');

const rawUtils = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'node_modules', 'bootstrap.native', 'lib', 'V4', 'utils.js'));
const rawTooltip = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'node_modules', 'bootstrap.native', 'lib', 'V4', 'tooltip-native.js'));
const rawDropdown = fs.readFileSync(path.resolve(__dirname, '..', '..', '..', 'node_modules', 'bootstrap.native', 'lib', 'V4', 'dropdown-native.js'));

module.exports = () => {
  return {
    code: `
      "use strict";

      ${rawUtils};
      ${rawTooltip};
      ${rawDropdown};

      export {
        Tooltip,
        Dropdown
      };
    `,
    cacheable: true
  }
};
