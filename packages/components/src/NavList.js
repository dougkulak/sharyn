// @flow

/* eslint-disable import/no-extraneous-dependencies */
import React from 'react'
import { Link } from 'react-router-dom'

import List from '@material-ui/core/List'
import DrawerItem from './DrawerItem'

type RouteWithOptions = {
  path: string,
  title: string,
  Icon?: Function,
  hardLink?: boolean,
  newTab?: boolean,
}

const mergeNavItems = (navItemPairs: any[]): RouteWithOptions[] =>
  navItemPairs.map(i => (Array.isArray(i) ? { ...i[0], ...i[1] } : i))

const NavList = ({ navItems }: { navItems: any[] }) => (
  <List>
    {mergeNavItems(navItems).map(
      ({ path, title: label, Icon, hardLink, newTab }) =>
        hardLink || newTab ? (
          <a href={path} key={path} {...(newTab ? { target: '_blank' } : {})}>
            <DrawerItem label={label} icon={Icon} />
          </a>
        ) : (
          <Link to={path} key={path}>
            <DrawerItem label={label} icon={Icon} />
          </Link>
        ),
    )}
  </List>
)

export default NavList
