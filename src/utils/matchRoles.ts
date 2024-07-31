export function matchRoles(roles: string[], userRoles: string[]) {
  if (!roles || roles.length === 0) {
    return true;
  } else if (roles.includes('*')) {
    return true;
  } else {
    return roles.some((role) => userRoles && userRoles.includes(role));
  }
}
