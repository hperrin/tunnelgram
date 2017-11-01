import React from 'react';
import FilterLink from '../containers/FilterLink';

const Footer = () => (
  <p>
    Show:
    {' '}
    <FilterLink filter="SHOW_ALL">
      All
    </FilterLink>
    {', '}
    <FilterLink filter="SHOW_OPEN">
      Open
    </FilterLink>
    {', '}
    <FilterLink filter="SHOW_DONE">
      Done
    </FilterLink>
  </p>
);

export default Footer;
