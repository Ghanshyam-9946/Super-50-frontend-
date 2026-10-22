// `role` is the menu somebody lands on; `roles` is everything they may do.
// A promoted alumnus is role 'alumni' with 'student' still in roles, so the
// student side of the app has to ask about roles, never about role.
export const rolesOf = (user) => (user?.roles?.length ? user.roles : [user?.role].filter(Boolean));

export const hasRole = (user, role) => rolesOf(user).includes(role);

// True for a current student and for an alumnus looking at their own pages.
export const isStudentAccount = (user) => hasRole(user, 'student');
